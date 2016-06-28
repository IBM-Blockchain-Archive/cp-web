#MsgPackStream

Streams of framed [msgpack](http://msgpack.org) messages.

[![testling badge](https://ci.testling.com/dominictarr/msgpack-stream.png)](https://ci.testling.com/dominictarr/msgpack-stream)

## WARNING

this module is *not recommended* parsing `msgpack` in js is much slower
than spliting json into lines and parsing with `JSON.parse`, which is heavily
optimised in all good js implementations.

instead use: [es.parse](https://github.com/dominictarr/event-stream#parse) and [es.stringify](https://github.com/dominictarr/event-stream#stringify)

If you really want to use `msgpack` you should fix this issue: [pgreiss/node-msgpack#16](https://github.com/pgriess/node-msgpack/issues/16)

## usage

``` js

var mps = require('msgpack-stream')

var encode = mps.createEncodeStream()
var decode = mps.createDecodeStream()

encode.pipe(decode)

decode.on('data', console.log)

encode.write('HELLO')
encode.write({object: true})
encode.write(true)
encode.write(AnyValidJsObject) //!
```

## remarks

this is mostly pulled out of [smith](https://github.com/c9/smith) and slightly refactored to fit a stream.

## lies

Actually, msgpack does not support much loved js objects such as `Infinity`, or `Nan`. 

On the other hand, `msgpack-stream` uses [creationix/msgpack-js](https://github.com/creationix/msgpack-js) which implements a slightly extended protocol, so you can pack `Buffer` and `undefined`
