# Lock.host-node
Lock.host node example, see: [Lock.host](https://github.com/rhodey/lock.host)

This demonstration uses OpenAI to control a Solana wallet:
+ Unmodified OpenAI lib
+ Unmodified Solana lib
+ Hit /api/ask?message=your best joke&addr=abc123
+ OAI is asked "You are to decide if a joke is funny or not"
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
    "PCR0": "9a2f959805a56f8729c48e219591d2db1ec50af35c1c195b13cdc508d6ef81ecb1683fb7aa6f9f5901685f7fd2a95cc7",
    "PCR1": "4b4d5b3661b3efc12920900c80e126e4ce783c522de6c02a2a5bf7af3a2b9327b86776f188e4be1c1c404a129dbda493",
    "PCR2": "b8a983e997c911dd5a0ad5bbb3322aa998180e4750b99dd2c6506189816e8de673c4fd46b67658bb05d7b9c936c726d5"
  }
}
```

See that [run.yml](.github/workflows/run.yml) is testing that PCRs in this readme match the build

## Test
+ In test a container emulates a TEE
+ Two fifos /tmp/read and /tmp/write emulate a vsock
```
just serve-alpine
just build-test-app make-test-fifos
cp example.env .env
docker compose up -d
just ask-funds
...
addr = wJQASiSgaqVJBP8iQUpyTpNcpQinMWg17unrNTbbYoC
sol = 0.025
json = {
  signatute: 'mHPgWppbhKujn8deozVGQurtpqPAcQ1nMg99uSmwmrmSp8m8GPRiXha36D2AJ42bNRzTG9xbhar1w7MRf2mUoLp',
  from: 'AkHqQ324DvygPxuhyYs9BTVG8b1BXzTnpbCxqG8zousm',
  to: 'wJQASiSgaqVJBP8iQUpyTpNcpQinMWg17unrNTbbYoC'
}
sol = 0.026
(look inside node/ask-funds.js)
```

## Prod
+ In prod all I/O passes through /dev/vsock
```
just serve-alpine
just build-app
just run-app
cp example.env .env
just run-host
```

## Apks
Modify apk/Dockerfile.fetch to include all apks then run:
```
just proxy-alpine
just fetch-alpine
```

## License
MIT

hello@lock.host
