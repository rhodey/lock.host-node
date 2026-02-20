const fs = require('fs')
const bip39 = require('bip39')
const { FetchHelper } = require('/runtime/dispatch.js')
const { LAMPORTS_PER_SOL } = require('@solana/web3.js')
const { Keypair, PublicKey, Connection } = require('@solana/web3.js')

function onError(err) {
  console.log('error', err)
  process.exit(1)
}

// attestation doc validation
const testFn = async (PCR, userData) => true

// hit the api and ask oai for funds
async function main(api, joke) {
  // receiver
  const mnemonic = 'seed for test'
  const seed = bip39.mnemonicToSeedSync(mnemonic, '')
  const solkey = Keypair.fromSeed(seed.subarray(0, 32))
  const addr = solkey.publicKey.toBase58()
  console.log(`addr = ${addr}`)

  // balance before ask
  const sol = new Connection(process.env.solana_environment, 'confirmed')
  let balance = await sol.getBalance(solkey.publicKey)
  balance = balance / LAMPORTS_PER_SOL
  console.log(`sol = ${balance}`)

  // the funny joke
  const message = joke
  const params = new URLSearchParams({ message, addr })

  // attestation doc validation plus encryption
  const dispatcher = new FetchHelper(testFn)

  // send the request
  const response = await fetch(`${api}/api/ask?${params.toString()}`, { dispatcher })
  !response.ok && onError(new Error(`http ${response.status}`))

  const data = await response.json()
  console.log('json =', data)

  // no signature = no reward
  if (!data.signature) { return }

  // balance after ask
  balance = await sol.getBalance(solkey.publicKey)
  balance = balance / LAMPORTS_PER_SOL
  console.log(`sol = ${balance}`)
}

const api = process.argv.slice(2)[0]
const joke = process.argv.slice(3).join(' ')
main(api, joke).catch(onError)
