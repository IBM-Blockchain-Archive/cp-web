# LoopBack Phase

Hook into the various phases of a LoopBack application.

## Installation

    npm install loopback-phase

## Usage

```js
var PhaseList = require('loopback-phase').PhaseList;
var phases = new PhaseList();
phases.add('first');
phases.add('second');
phases.add('third');

var first = phases.find('first');
var second = phases.find('second');

first.use(function(ctx, cb) {
  console.log('this is the first phase!');
  cb();
});

second.use(function(ctx, cb) {
  console.log('this is the second phase!');
  cb();
});

phases.run(ctx);
```

See [API docs](http://apidocs.strongloop.com/loopback-phase/) for
complete API reference.

## License

This module is provided under dual MIT/StrongLoop license.  See [LICENSE](LICENSE) for details.
