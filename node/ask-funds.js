const fs = require('fs')
const bip39 = require('bip39')
const { AttestAgent } = require('./dispatch.js')
const { LAMPORTS_PER_SOL } = require('@solana/web3.js')
const { Keypair, PublicKey, Connection } = require('@solana/web3.js')

function onError(err) {
  console.log('error', err)
  process.exit(1)
}

// hit the api and ask oai for funds
async function main(api) {
  // receiver
  const mnemonic = 'test for ask'
  const seed = bip39.mnemonicToSeedSync(mnemonic, '')
  const solkey = Keypair.fromSeed(seed.subarray(0, 32))
  const addr = solkey.publicKey.toBase58()
  console.log(`addr = ${addr}`)

  // balance before ask
  const sol = new Connection(process.env.solana_environment, 'confirmed')
  let balance = await sol.getBalance(solkey.publicKey)
  balance = balance / LAMPORTS_PER_SOL
  console.log(`sol = ${balance}`)

  const message = 'why did the worker quit his job at the recycling factory? because it was soda pressing'
  const params = new URLSearchParams({ message, addr })

  // attestation doc validation plus ECC encryption
  const PCR = fs.readFileSync('/tmp/PCR.txt', { encoding: 'utf8' }).split(`\n`).slice(0, 3)
  const dispatcher = new AttestAgent(PCR)

  // send the request
  const response = await fetch(`${api}/api/ask?${params.toString()}`, { dispatcher })
  !response.ok && onError(new Error(`http ${response.status}`))

  const data = await response.json()
  console.log('json =', data)

  // thoughts = reason for denial
  if (data.thoughts) { return }

  // balance after ask
  balance = await sol.getBalance(solkey.publicKey)
  balance = balance / LAMPORTS_PER_SOL
  console.log(`sol = ${balance}`)
}

const args = process.argv.slice(2)
const [api] = args
main(api).catch(onError)
