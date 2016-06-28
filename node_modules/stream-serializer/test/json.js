
var through   = require('through')
var serialize = require('..')

require('tape')('json messages', function (t) {

  var expected = [1, 2, 3], actual = []
  var ended = false

  var ss = serialize()(through(function (data) {
    var n = expect = expected.shift()
    t.equal(data, n)
    console.log(data)
    this.emit('data', data)
  }, function () {
    ended = true
  }))


  ss.on('data', function (d) {
    console.log('>>', d, '<<')
    actual.push(d)
  })
  ss.write('1\n2\n3\n')
  ss.end()

  t.equal(expected.length, 0)
  t.deepEqual(actual, ['1\n', '2\n', '3\n'])
  t.equal(ended, true)
  t.end()
})
