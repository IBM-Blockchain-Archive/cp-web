var mps = require('./index')

var encode = mps.createEncodeStream()
var decode = mps.createDecodeStream()
var assert = require('assert')

require('tape')('simple', function (t) {

  var expected = [
    1,
    0,
    null,
    true,
    "hello",
    'string\nwith\nlines',
    {object: true, name: 'no need for a name'},
    ['this', 'that', {}, [], [null]],
    Math.PI,
    true,
    false,
  //  Infinity,   //doesn't work
  //  NaN,        //doesn't work
    {obj: {}}
  ]

  var toSend = expected.slice()
    , expectedItems = expected.slice()
    , actual = []

  encode
  .pipe(decode)
  .on('data', function (obj) {
    console.log(obj)
    actual.push(obj)
    t.deepEqual(obj, expectedItems.shift())
  })
  .on('end', function () {
    t.deepEqual(actual, expected)
    t.end()
  })

  while(toSend.length)
    encode.write(toSend.shift())
  encode.end()

})
