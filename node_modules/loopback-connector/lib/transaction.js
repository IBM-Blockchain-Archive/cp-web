var assert = require('assert');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('loopback:connector:transaction');

module.exports = Transaction;

/**
 * Create a new Transaction object
 * @param {Connector} connector The connector instance
 * @param {*} connection A connection to the DB
 * @constructor
 */
function Transaction(connector, connection) {
  this.connector = connector;
  this.connection = connection;
  EventEmitter.call(this);
}

util.inherits(Transaction, EventEmitter);

// Isolation levels
Transaction.SERIALIZABLE = 'SERIALIZABLE';
Transaction.REPEATABLE_READ = 'REPEATABLE READ';
Transaction.READ_COMMITTED = 'READ COMMITTED';
Transaction.READ_UNCOMMITTED = 'READ UNCOMMITTED';

Transaction.hookTypes = {
  BEFORE_COMMIT: 'before commit',
  AFTER_COMMIT: 'after commit',
  BEFORE_ROLLBACK: 'before rollback',
  AFTER_ROLLBACK: 'after rollback',
  TIMEOUT: 'timeout'
};

/**
 * Commit a transaction and release it back to the pool
 * @param cb
 * @returns {*}
 */
Transaction.prototype.commit = function(cb) {
  return this.connector.commit(this.connection, cb);
};

/**
 * Rollback a transaction and release it back to the pool
 * @param cb
 * @returns {*|boolean}
 */
Transaction.prototype.rollback = function(cb) {
  return this.connector.rollback(this.connection, cb);
};

/**
 * Begin a new transaction
 * @param {Connector} connector The connector instance
 * @param {Object} [options] Options {isolationLevel: '...', timeout: 1000}
 * @param cb
 */
Transaction.begin = function(connector, options, cb) {
  if (typeof isolationLevel === 'function' && cb === undefined) {
    cb = options;
    options = {};
  }
  if (typeof options === 'string') {
    options = {isolationLevel: options};
  }
  var isolationLevel = options.isolationLevel || Transaction.READ_COMMITTED;
  assert(isolationLevel === Transaction.SERIALIZABLE ||
    isolationLevel === Transaction.REPEATABLE_READ ||
    isolationLevel === Transaction.READ_COMMITTED ||
    isolationLevel === Transaction.READ_UNCOMMITTED, 'Invalid isolationLevel');

  debug('Starting a transaction with options: %j', options);
  assert(typeof connector.beginTransaction === 'function',
    'beginTransaction must be function implemented by the connector');
  connector.beginTransaction(isolationLevel, function(err, connection) {
    if (err) {
      return cb(err);
    }
    var tx = connection;
    if (!(connection instanceof Transaction)) {
      tx = new Transaction(connector, connection);
    }
    cb(err, tx);
  });
};
