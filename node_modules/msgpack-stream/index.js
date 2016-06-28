/*
Copyright (c) 2012 Ajax.org B.V

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var msgpack = require('msgpack-js');
var through = require('through');
var bops    = require('bops')

////////////////////////////////////////////////////////////////////////////////

// Transport is a connection between two Agents.  It lives on top of a duplex,
// binary stream.
// @input - the stream we listen for data on
// @output - the stream we write to (can be the same object as input)
// @send(message) - send a message to the other side
// "message" - event emitted when we get a message from the other side.
// "disconnect" - the transport was disconnected
// "error" - event emitted for stream error or disconnect
// "drain" - drain event from output stream
exports.createEncodeStream = 
function () {
  return through(function (data) {
    // console.log('SEND')
    send(this, data)
  })
}

function send (output, message) {
    // Uncomment to debug protocol
    // console.log(process.pid + " -> " + inspect(message, false, 2, true));

    // Serialize the messsage.
    var frame = msgpack.encode(message);

    // Send a 4 byte length header before the frame.
    var header = bops.create(4);
    bops.writeUInt32BE(header, frame.length, 0);
    output.emit('data', header);

    // Send the serialized message.
    return output.emit('data', frame);
};


exports.createDecodeStream = 
function  () {
    var stream
    return stream = through(deFramer(function (frame) {
        // console.log(frame)
        var message;
        try {
            message = msgpack.decode(frame);
        } catch (err) {
            return stream.emit("error", err);
        }

        stream.emit('data', message)
    }))
}

function Transport(input, output) {
    var parse = deFramer(function (frame) {
        var message;
        try {
            message = msgpack.decode(frame);
        } catch (err) {
            return self.emit("error", err);
        }
        // console.log(process.pid + " <- " + inspect(message, false, 2, true));
        self.emit("message", message);
    });

    // Route data chunks to the parser, but check for errors
    function onData(chunk) {
        try {
            parse(chunk);
        } catch (err) {
            self.emit("error", err);
        }
    }
}

// A simple state machine that consumes raw bytes and emits frame events.
// Returns a parser function that consumes buffers.  It emits message buffers
// via onMessage callback passed in.
function deFramer(onFrame) {
    var buffer;
    var state = 0;
    var length = 0;
    var offset;
    return function parse(chunk) {
        for (var i = 0, l = chunk.length; i < l; i++) {
            switch (state) {
            case 0: length |= chunk[i] << 24; state = 1; break;
            case 1: length |= chunk[i] << 16; state = 2; break;
            case 2: length |= chunk[i] << 8; state = 3; break;
            case 3: length |= chunk[i]; state = 4;
                buffer = bops.create(length);
                offset = 0;
                break;
            case 4:
                var len = l - i;
                var emit = false;
                if (len + offset >= length) {
                    emit = true;
                    len = length - offset;
                }
                // TODO: optimize for case where a copy isn't needed can a slice can
                // be used instead?
                bops.copy(chunk, buffer, offset, i, i + len);
                offset += len;
                i += len - 1;
                if (emit) {
                    state = 0;
                    length = 0;
                    var _buffer = buffer
                    buffer = undefined;
                    offset = undefined;
                    onFrame(_buffer);
                }
                break;
            }
        }
    };
}

