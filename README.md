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
    "PCR0": "a858981f4dd9399b6de65c021b51631f383a3559b7cc78d44ecf84c9bb43d3640cb6adb6d483bf50200b78d07a975453",
    "PCR1": "4b4d5b3661b3efc12920900c80e126e4ce783c522de6c02a2a5bf7af3a2b9327b86776f188e4be1c1c404a129dbda493",
    "PCR2": "b2fb1212bba8826d5feccfb6d43a9317d3789851cd6c0c57be241a4cfeef7401cc2e51fb245fbcbf0df153ddebfdd5af"
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
