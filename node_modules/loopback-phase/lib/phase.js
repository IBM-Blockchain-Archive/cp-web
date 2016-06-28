// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback-phase
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var async = require('async');

module.exports = Phase;

/**
 * A slice of time in an application. Provides hooks to allow
 * functions to be executed before, during and after, the defined slice.
 * Handlers can be registered to a phase using `before()`, `use()`, or `after()`
 * so that they are placed into one of the three stages.
 *
 * ```js
 * var Phase = require('loopback-phase').Phase;
 *
 * // Create a phase without id
 * var anonymousPhase = new Phase();
 *
 * // Create a named phase
 * var myPhase1 = new Phase('my-phase');
 *
 * // Create a named phase with id & options
 * var myPhase2 = new Phase('my-phase', {parallel: true});
 *
 * // Create a named phase with options only
 * var myPhase3 = new Phase({id: 'my-phase', parallel: true});
 *
 * ```
 *
 * @class Phase
 *
 * @prop {String} id The name or identifier of the `Phase`.
 * @prop {Object} options The options to configure the `Phase`
 *
 * @param {String} [id] The name or identifier of the `Phase`.
 * @options {Object} [options] Options for the `Phase`
 * @property {String} [id] The name or identifier of the Phase
 * @property {Boolean} [parallel] To execute handlers in the same stage
 * in parallel
 * @end
 */

function Phase(id, options) {
  if (typeof id === 'object' && options === undefined) {
    options = id;
    id = options.id;
  }
  this.id = id;
  this.options = options || {};
  this.handlers = [];
  this.beforeHandlers = [];
  this.afterHandlers = [];
}

/**
 * Register a phase handler. The handler will be executed
 * once the phase is launched. Handlers must callback once
 * complete. If the handler calls back with an error, the phase will immediately
 * halt execution and call the callback provided to
 * `phase.run(callback)`.
 *
 * **Example**
 *
 * ```js
 * phase.use(function(ctx, next) {
 *   // specify an error if one occurred...
 *   var err = null;
 *   console.log(ctx.message, 'world!'); // => hello world
 *   next(err);
 * });
 *
 * phase.run({message: 'hello'}, function(err) {
 *   if(err) return console.error('phase has errored', err);
 *   console.log('phase has finished');
 * });
 * ```
 */

Phase.prototype.use = function(handler) {
  this.handlers.push(handler);
  return this;
};

/**
 * Register a phase handler to be executed before the phase begins.
 * See `use()` for an example.
 *
 * @param {Function} handler
 */

Phase.prototype.before = function(handler) {
  this.beforeHandlers.push(handler);
  return this;
};

/**
 * Register a phase handler to be executed after the phase completes.
 * See `use()` for an example.
 *
 * @param {Function} handler
 */

Phase.prototype.after = function(handler) {
  this.afterHandlers.push(handler);
  return this;
};

/**
 * Begin the execution of a phase and its handlers. Provide
 * a context object to be passed as the first argument for each handler
 * function.
 *
 * The handlers are executed in serial stage by stage: beforeHandlers, handlers,
 * and afterHandlers. Handlers within the same stage are executed in serial by
 * default and in parallel only if the options.parallel is true,
 *
 * @param {Object} [context] The scope applied to each handler function.
 * @callback {Function} callback
 * @param {Error} err Any `Error` that occurs during the execution of
 * the phase.
 */

Phase.prototype.run = function(ctx, cb) {
  if (typeof ctx === 'function') {
    cb = ctx;
    ctx = {};
  }

  var self = this;
  // Run a single handler with ctx
  function runHandler(handler, done) {
    handler(ctx, done);
  }

  // Run an array of handlers with ctx
  function runHandlers(handlers, done) {
    // Only run the handlers in parallel if the options.parallel is true
    if (self.options.parallel) {
      async.each(handlers, runHandler, done);
    } else {
      async.eachSeries(handlers, runHandler, done);
    }
  }

  async.eachSeries([this.beforeHandlers, this.handlers, this.afterHandlers],
    runHandlers, cb);
};


/**
 * Return the `Phase` as a string.
 */

Phase.prototype.toString = function() {
  return this.id;
};

// Internal flag to be used instead of
// `instanceof Phase` which breaks
// when there are two instances of
// `require('loopback-phase')

Phase.prototype.__isPhase__ = true;
