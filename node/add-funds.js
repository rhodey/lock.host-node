const { LAMPORTS_PER_SOL } = require('@solana/web3.js')
const { Keypair, PublicKey, Connection } = require('@solana/web3.js')
const bip39 = require('bip39')

function onError(err) {
  console.log('error', err)
  process.exit(1)
}

// add funds to wallet for testing
async function main() {
  const mnemonic = 'persistent keys arrive soon'
  const seed = bip39.mnemonicToSeedSync(mnemonic, '')
  const solkey = Keypair.fromSeed(seed.subarray(0, 32))
  const addr = solkey.publicKey.toBase58()
  console.log(`addr = ${addr}`)

  const sol = new Connection(process.env.solana_environment, 'confirmed')
  const signature = await sol.requestAirdrop(solkey.publicKey, LAMPORTS_PER_SOL)
  const { blockhash, lastValidBlockHeight } = await sol.getLatestBlockhash()
  await sol.confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature
  })

  let balance = await sol.getBalance(solkey.publicKey)
  balance = balance / LAMPORTS_PER_SOL
  console.log(`sol = ${balance}`)
}

main().catch(onError)
