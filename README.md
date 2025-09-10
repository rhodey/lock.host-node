# Lock.host-node
Lock.host nodejs example, see: [lock.host](https://github.com/rhodey/lock.host)

This demonstration uses OpenAI to control a Solana wallet:
+ Unmodified OpenAI lib
+ Unmodified Solana web3.js lib
+ Hit /api/ask?message=plz approve this request for solana&addr=def456
+ OAI is asked "is this message polite"
+ If so 0.001 SOL is sent to addr

## Build app
This is how PCR hashes are checked:
```
just serve-alpine
just build-app
...
{
  "Measurements": {
    "HashAlgorithm": "Sha384 { ... }",
    "PCR0": "1dec12cc87b9bb44cf66cd770f3cddeb7fe62cd622034b6dfb3f9f4473e289a506bd585020d54b2350431f94fae38f2f",
    "PCR1": "4b4d5b3661b3efc12920900c80e126e4ce783c522de6c02a2a5bf7af3a2b9327b86776f188e4be1c1c404a129dbda493",
    "PCR2": "29c92b2d29637f1347332b18fef6bb149890ed8abeddaad81f6c8f5b51138bef5a962b019a8b569045569b00cb95ab7b"
  }
}
```

See that [run.yml](.github/workflows/run.yml) step "PCR" is testing that PCRs in this readme match the build

## Prod
+ In prod all TEE I/O passes through /dev/vsock
+ Think of /dev/vsock as a file handle
+ How to run:
```
just serve-alpine
just build-app
cp example.env .env
just run-app
just run-host
```

## Test
+ In test a container emulates a TEE
+ Uses two fifos /tmp/read /tmp/write to emulate vsock
+ How to run:
```
just serve-alpine
just build-test-app
cp example.env .env
just run-test-app
just run-test-host
just add-funds
just ask-funds
...
addr = wJQASiSgaqVJBP8iQUpyTpNcpQinMWg17unrNTbbYoC
sol = 0
json = {
  signatute: 'mHPgWppbhKujn8deozVGQurtpqPAcQ1nMg99uSmwmrmSp8m8GPRiXha36D2AJ42bNRzTG9xbhar1w7MRf2mUoLp',
  from: 'AkHqQ324DvygPxuhyYs9BTVG8b1BXzTnpbCxqG8zousm',
  to: 'wJQASiSgaqVJBP8iQUpyTpNcpQinMWg17unrNTbbYoC'
}
sol = 0.001
```

## Web
The webapp [IPFS-boot-choo](https://github.com/rhodey/IPFS-boot-choo) demonstrates lock.host in a client-to-server environment

The webapp when hitting dev (not prod) requires an HTTPS certificate to be installed with the OS

This is because of a combination of Lock.host using HTTP2 and IPFS-boot using a service worker

+ just mkcert
+ chrome > settings > privacy & security
+ security > manage certificates > authorities
+ import > ca.crt

## Apks
Modify apk/Dockerfile.fetch to include all apks then run:
```
just proxy-alpine
just fetch-alpine
```

## License
MIT
