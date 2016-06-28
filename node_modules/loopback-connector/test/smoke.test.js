var assert = require('assert');
var connector = require('../');

describe('loopback-connector', function() {
  it('exports Connector', function() {
    assert(connector.Connector);
  });

  it('exports SqlConnector', function() {
    assert(connector.SqlConnector);
  });

  it('exports SQLConnector', function() {
    assert(connector.SQLConnector);
  });

  it('creates aliases to Connector.prototype.execute', function() {
    assert.equal(connector.Connector.prototype.execute,
      connector.Connector.prototype.query);
    assert.equal(connector.Connector.prototype.execute,
      connector.Connector.prototype.command);
  });

  it('creates aliases to SQLConnector.prototype.execute', function() {
    assert.equal(connector.SQLConnector.prototype.execute,
      connector.SQLConnector.prototype.query);
    assert.equal(connector.SQLConnector.prototype.execute,
      connector.SQLConnector.prototype.command);
  });
});
