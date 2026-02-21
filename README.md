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
    "PCR0": "80477e19a6b980f839f0aa858ca60bd01f4212e46aec3873fcd8284c97e9954b50011d5282ce4c8159539e900fc39786",
    "PCR1": "4b4d5b3661b3efc12920900c80e126e4ce783c522de6c02a2a5bf7af3a2b9327b86776f188e4be1c1c404a129dbda493",
    "PCR2": "a7bef24e6317debe02bb056bc9c1b1be10a859acffd9ec80ab5515fcb0e5b1ac08b7ae77ab221df1f1f61b1823e0b65a"
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
