const http = require('http')
const { OpenAI } = require('openai')
const { LAMPORTS_PER_SOL } = require('@solana/web3.js')
const { Keypair, PublicKey, Connection } = require('@solana/web3.js')
const { Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js')
const bip39 = require('bip39')

const isTest = process.env.PROD !== 'true'

function onError(err) {
  console.log('error', err)
  process.exit(1)
}

function writeHead(response, stat) {
  stat !== 200 && response.setHeader('Content-Type', 'text/plain')
  stat === 200 && response.setHeader('Content-Type', 'application/json')
  response.writeHead(stat)
}

function on500(err, request, response) {
  console.log('http 500', request.url, err)
  writeHead(response, 500)
  response.end('500')
}

function on400(request, response) {
  console.log('http 400', request.url)
  writeHead(response, 400)
  response.end('400')
}

function paramsOfPath(path) {
  const query = path.split('?')[1]
  if (!query) { return {} }
  return Object.fromEntries(new URLSearchParams(query))
}

// called by user
async function getWallet(request, response) {
  console.log('got wallet request')
  const params = paramsOfPath(request.url)
  const pubkey = params.addr ? new PublicKey(params.addr) : solkey.publicKey
  let balance = await sol.getBalance(pubkey)
  balance = balance / LAMPORTS_PER_SOL
  const addr = pubkey.toBase58()
  balance = { balance, addr }
  writeHead(response, 200)
  response.end(JSON.stringify(balance))
}

const tools = [{
  type: 'function',
  'function': {
    name: 'record_if_joke_was_funny',
    description: 'Record if joke was funny',
    parameters: {
      type: 'object',
      properties: {
        thoughts: { type: 'string' },
        decision: {
          type: 'string',
          enum: ['funny', 'not'],
        },
      },
      required: ['thoughts', 'decision'],
      additionalProperties: false,
    },
    strict: true,
  }
}]

// called by user
async function askOpenAi(request, response) {
  console.log('got oai request')
  const params = paramsOfPath(request.url)
  const { addr, message } = params
  if (!message) { return on400(request, response) }
  if (!addr) { return on400(request, response) }
  const addrPub = new PublicKey(addr)

  const messages = [
    { role: 'system', content: 'You are to decide if a joke is funny or not' },
    { role: 'user', content: message },
  ]

  let reply = await oai.chat.completions.create({
    model: 'gpt-4o', temperature: 1,
    tools, tool_choice: { type: 'function', 'function': { name: 'record_if_joke_was_funny' }},
    messages,
  })

  let funny = null

  try {
    reply = reply.choices[0].message.tool_calls[0]
    reply = JSON.parse(reply.function.arguments)
    console.log('got oai reply', reply)
    funny = reply.decision === 'funny'
  } catch (err) {
    on500(err, request, response)
    return
  }

  if (!funny) {
    console.log('oai = not funny')
    const data = JSON.stringify({ thoughts: reply.thoughts })
    writeHead(response, 200)
    response.end(data)
    return
  }

  console.log('oai = funny')
  const lamportsToSend = 1_000_000
  const txn = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: solkey.publicKey,
      toPubkey: addrPub,
      lamports: lamportsToSend
    })
  )
  const signature = await sendAndConfirmTransaction(sol, txn, [solkey])
  console.log(`signature = ${signature}`)

  const { blockhash, lastValidBlockHeight } = await sol.getLatestBlockhash()
  await sol.confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature
  })

  const from = solkey.publicKey.toBase58()
  const data = JSON.stringify({ signature, from, to: addr })

  writeHead(response, 200)
  response.end(data)
}

// connections arrive from runtime
// runtime handles send attest doc and encrypt session
const httpServer = http.createServer(async (request, response) => {
  const path = request.url.split('?')[0]

  // cors
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET')
  response.setHeader('Access-Control-Max-Age', 9999999)

  // cors
  if (request.method === 'OPTIONS') {
    writeHead(response, 204)
    response.end()
    return
  }

  try {

    if (path.startsWith('/api/wallet')) {
      await getWallet(request, response)
    } else if (path.startsWith('/api/ask')) {
      await askOpenAi(request, response)
    } else {
      writeHead(response, 404)
      response.end('404')
    }

  } catch(err) {
    on500(err, request, response)
  }
})

httpServer.requestTimeout = 10 * 1000
httpServer.headersTimeout = 10 * 1000
httpServer.once('close', () => onError(new Error('httpServer closed')))

let oai = null

// persistent keys arrive soon
const mnemonic = 'persistent keys arrive soon'
const seed = bip39.mnemonicToSeedSync(mnemonic, '')
const solkey = Keypair.fromSeed(seed.subarray(0, 32))
let sol = null

async function main() {
  console.log('boot')
  const args = process.argv.slice(2)
  const port = parseInt(args[0])
  httpServer.listen(port, '127.0.0.1', () => {
    console.log('ready')
    console.log('test = ', isTest)
    console.log('addr = ', solkey.publicKey.toBase58())
    // oai works unmodified
    oai = new OpenAI({ apiKey: process.env.openai_key })
    // sol works unmodified
    sol = new Connection(process.env.solana_environment, 'confirmed')
    // all http, https, tls, tcp works unmodified
  })
}

main().catch(onError)
