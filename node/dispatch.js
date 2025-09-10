const crypto = require('crypto')
const sodium = require('libsodium-wrappers')
const attestParse = require('/runtime/attest-parse.js')
const http2 = require('http2')
const { Dispatcher } = require('undici')
const cookies = require('cookie')

class AttestAgent extends Dispatcher {
  constructor(PCR) {
    super()
    this.PCR = PCR
  }

  async sendHello(opts, nonce) {
    await sodium.ready
    const keys = sodium.crypto_kx_keypair()
    const publicKey = Buffer.from(keys.publicKey).toString('base64')
    const params = new URLSearchParams({ publicKey, nonce, envelope: 'json' })

    return new Promise((res, rej) => {
      const conn = http2.connect(opts.origin, { rejectUnauthorized: false })
      const req = conn.request({ ':path': `/lockhost/hello?${params.toString()}` })

      let status = null
      let cookie = null
      let body = []

      req.on('response', (headers) => {
        status = headers[':status']
        cookie = headers['set-cookie'] || ''
        cookie = cookie[0] || ''
        cookie = cookies.parse(cookie)
        cookie = cookie?.sessionlh
      })

      req.on('data', (data) => body.push(data))
      req.on('end', () => {
        conn.close()
        body = Buffer.concat(body).toString('utf8')
        try {
          body = JSON.parse(body)
          res({ status, cookie, body, keys })
        } catch (err) {
          rej(new Error('hello = reply not json'))
        }
      })
      req.end()
    })
  }

  async startState(hello, nonce) {
    const { status, cookie, body, keys } = hello
    if (status !== 200) {
      throw new Error(`hello = status ${status}`)
    } else if (!cookie) {
      throw new Error(`hello = no cookie`)
    }

    let { attestDoc } = body
    attestDoc = Buffer.from(attestDoc, 'base64')
    const ok = await attestParse(attestDoc)
    const { publicKey, nonce: nonce2, PCR } = ok

    if (nonce !== nonce2.toString('base64')) {
      throw new Error('hello = attest doc nonce not ok')
    } else if (this.PCR.join(',') !== PCR.join(',')) {
      throw new Error('hello = attest doc PCR not ok')
    }

    try {
      const sessionKeys = sodium.crypto_kx_client_session_keys(
        keys.publicKey, keys.privateKey,
        publicKey
      )
      return { cookie, sessionKeys, PCR }
    } catch (err) {
      throw new Error('hello = attest doc key not ok')
    }
  }

  sendAndGetBody(cookie, opts, data) {
    const conn = http2.connect(opts.origin, { rejectUnauthorized: false })
    const req = conn.request({
      ':method': 'POST',
      ':path': `/lockhost/session`,
      'cookie': `sessionlh=${cookie}`
    })

    let body = []
    let status = null

    req.on('response', (headers) => {
      status = headers[':status']
    })

    return new Promise((res, rej) => {
      req.on('data', (data) => body.push(data))
      req.on('end', () => {
        conn.close()
        if (status !== 200) {
          rej(new Error(`session = status ${status}`))
          return
        }

        body = Buffer.concat(body).toString('utf8')
        try {
          body = JSON.parse(body)
          res(body)
        } catch (err) {
          rej(new Error('session = reply not json'))
        }
      })
      req.end(data)
    })
  }

  async dispatch(opts, handler) {
    let nonce = crypto.randomBytes(32).toString('base64')
    const hello = await this.sendHello(opts, nonce)
    const state = await this.startState(hello, nonce)

    const path = opts.path
    const method = opts.method
    let headers = opts.headers
    const isJson = (body) => typeof body === 'object' && !Buffer.isBuffer(body)

    let data = { path, method, headers }
    opts.body && isJson(opts.body) && (opts.body = JSON.stringify(opts.body))
    opts.body && (opts.body = Buffer.from(opts.body))
    opts.body && (data.body = opts.body.toString('base64'))
    data = JSON.stringify(data)
    data = Buffer.from(data)

    let key = state.sessionKeys.sharedTx
    nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    let encrypted = sodium.crypto_secretbox_easy(data, nonce, key)
    nonce = Buffer.from(nonce).toString('base64')
    encrypted = Buffer.from(encrypted).toString('base64')
    data = { nonce, encrypted }
    data = JSON.stringify(data)

    const { cookie } = state
    data = await this.sendAndGetBody(cookie, opts, data)
    key = state.sessionKeys.sharedRx
    data.nonce = Buffer.from(data.nonce, 'base64')
    data.encrypted = Buffer.from(data.encrypted, 'base64')
    data = sodium.crypto_secretbox_open_easy(data.encrypted, data.nonce, key)

    data = Buffer.from(data)
    data = JSON.parse(data.toString('utf8'))

    let { status, body } = data
    body = Buffer.from(body, 'base64')
    headers = data.headers

    const resume = () => {}
    handler.onHeaders(status, headers, resume, '' + status)
    handler.onData(body)
    handler.onComplete(null)
  }
}

module.exports = { AttestAgent }
