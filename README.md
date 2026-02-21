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
    "PCR0": "74c2ca88f30ff02900d39b7a3927fba900da7340f9c7b5b6c8250e2355f9a7360398f848d750aabbfbfbeb28baccaf1b",
    "PCR1": "4b4d5b3661b3efc12920900c80e126e4ce783c522de6c02a2a5bf7af3a2b9327b86776f188e4be1c1c404a129dbda493",
    "PCR2": "0f62ef55c944aeb71144f1804aa6416a4a9c5a0406dc7f454cbf3a24a7d00ddff26edf1ca9b062a79103343f3ec36ef3"
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
just ask-funds 'why did the worker quit his job at the recycling factory? because it was soda pressing.'
...
addr = Do3F8NmohXPayS3xmos6CmqRXPD9DjCzK8Ct8sCc6UkA
sol = 0.002
json = {
  signature: '677Rtf2CcUonuh9f2UJhxLgmiX4EwQrR7vQ6CTydstdTExgqpUtgpy2HPYfmYVZRrYBvFnrQQpbTJW78oVw8zi1h',
  from: 'AkHqQ324DvygPxuhyYs9BTVG8b1BXzTnpbCxqG8zousm',
  to: 'Do3F8NmohXPayS3xmos6CmqRXPD9DjCzK8Ct8sCc6UkA',
  thoughts: "The joke plays on the pun between 'so depressing' and 'soda pressing', which is clever and light-hearted. It evokes a chuckle due to its wordplay."
}
sol = 0.003
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
