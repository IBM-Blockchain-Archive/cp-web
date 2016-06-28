// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-phase
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var Phase = require('./phase');
var zipMerge = require('./merge-name-lists');
var async = require('async');

module.exports = PhaseList;

/**
 * An ordered list of phases.
 *
 * ```js
 * var PhaseList = require('loopback-phase').PhaseList;
 * var phases = new PhaseList();
 * phases.add('my-phase');
 * ```
 *
 * @class PhaseList
 */

function PhaseList() {
  this._phases = [];
  this._phaseMap = {};
}

/**
 * Get the first `Phase` in the list.
 *
 * @returns {Phase} The first phase.
 */

PhaseList.prototype.first = function() {
  return this._phases[0];
};

/**
 * Get the last `Phase` in the list.
 *
 * @returns {Phase} The last phase.
 */

PhaseList.prototype.last = function() {
  return this._phases[this._phases.length - 1];
};

/**
 * Add one or more phases to the list.
 *
 * @param {Phase|String|String[]} phase The phase (or phases) to be added.
 * @returns {Phase|Phase[]} The added phase or phases.
 */

PhaseList.prototype.add = function(phase) {
  var phaseList = this;
  var phaseArray = Array.isArray(phase) ? phase : null;

  if(phaseArray) {
    return phaseArray.map(phaseList.add.bind(phaseList));
  }

  phase = this._resolveNameAndAddToMap(phase);
  this._phases.push(phase);

  return phase;
};

PhaseList.prototype._resolveNameAndAddToMap = function(phaseOrName) {
  var phase = phaseOrName;

  if(typeof phase === 'string') {
    phase = new Phase(phase);
  }

  if (phase.id in this._phaseMap) {
    throw new Error('Phase "' + phase.id + '" already exists.');
  }


  if(!phase.__isPhase__) {
    throw new Error('Cannot add a non phase object to a PhaseList');
  }

  this._phaseMap[phase.id] = phase;
  return phase;
};

/**
 * Add a new phase at the specified index.
 * @param {Number} index The zero-based index.
 * @param {String|String[]} phase The name of the phase to add.
 * @returns {Phase} The added phase.
 */

PhaseList.prototype.addAt = function(index, phase) {
  phase = this._resolveNameAndAddToMap(phase);
  this._phases.splice(index, 0, phase);
  return phase;
};

/**
 * Add a new phase as the next one after the given phase.
 * @param {String} after The referential phase.
 * @param {String|String[]} phase The name of the phase to add.
 * @returns {Phase} The added phase.
 */

PhaseList.prototype.addAfter = function(after, phase) {
  var ix = this.getPhaseNames().indexOf(after);
  if (ix === -1) {
    throw new Error('Unknown phase: "' + after + '"');
  }
  return this.addAt(ix+1, phase);
};

/**
 * Add a new phase as the previous one before the given phase.
 * @param {String} before The referential phase.
 * @param {String|String[]} phase The name of the phase to add.
 * @returns {Phase} The added phase.
 */

PhaseList.prototype.addBefore = function(before, phase) {
  var ix = this.getPhaseNames().indexOf(before);
  if (ix === -1) {
    throw new Error('Unknown phase: "' + before + '"');
  }
  return this.addAt(ix, phase);
};

/**
 * Remove a `Phase` from the list.
 *
 * @param {Phase|String} phase The phase to be removed.
 * @returns {Phase} The removed phase.
 */

PhaseList.prototype.remove = function(phase) {
  var phases = this._phases;
  var phaseMap = this._phaseMap;
  var phaseId;

  if(!phase) return null;

  if(typeof phase === 'object') {
    phaseId = phase.id;
  } else {
    phaseId = phase;
    phase = phaseMap[phaseId];
  }

  if(!phase || !phase.__isPhase__) return null;

  phases.splice(phases.indexOf(phase), 1);
  delete this._phaseMap[phaseId];

  return phase;
};

/**
 * Merge the provided list of names with the existing phases
 * in such way that the order of phases is preserved.
 *
 * **Example**
 *
 * ```js
 * // Initial list of phases
 * phaseList.add(['initial', 'session', 'auth', 'routes', 'files', 'final']);
 *
 * // zip-merge more phases
 * phaseList.zipMerge([
 *   'initial', 'postinit', 'preauth', 'auth',
 *   'routes', 'subapps', 'final', 'last'
 * ]);
 *
 * // print the result
 * console.log('Result:', phaseList.getPhaseNames());
 * // Result: [
 * //   'initial', 'postinit', 'preauth', 'session', 'auth',
 * //   'routes', 'subapps', 'files', 'final', 'last'
 * // ]
 * ```
 *
 * @param {String[]} names List of phase names to zip-merge
 */
PhaseList.prototype.zipMerge = function(names) {
  if (!names.length) return;

  var mergedNames = zipMerge(this.getPhaseNames(), names);
  this._phases = mergedNames.map(function(name) {
    var existing = this.find(name);
    return existing ?
      existing :
      this._resolveNameAndAddToMap(name);
  }, this);
};

/**
 * Find a `Phase` from the list.
 *
 * @param {String} id The phase identifier
 * @returns {Phase} The `Phase` with the given `id`.
 */

PhaseList.prototype.find = function(id) {
  return this._phaseMap[id] || null;
};

/**
 * Find or add a `Phase` from/into the list.
 *
 * @param {String} id The phase identifier
 * @returns {Phase} The `Phase` with the given `id`.
 */

PhaseList.prototype.findOrAdd = function(id) {
  var phase = this.find(id);
  if(phase) return phase;
  return this.add(id);
};

/**
 * Get the list of phases as an array of `Phase` objects.
 *
 * @returns {Phase[]} An array of phases.
 */

PhaseList.prototype.toArray = function() {
  return this._phases.slice(0);
};

/**
 * Launch the phases contained in the list. If there are no phases
 * in the list `process.nextTick` is called with the provided callback.
 *
 * @param {Object} [context] The context of each `Phase` handler.
 * @callback {Function} cb
 * @param {Error} err Any error that occured during a phase contained
 * in the list.
 */

PhaseList.prototype.run = function(ctx, cb) {
  var phases = this._phases;

  if(typeof ctx === 'function') {
    cb = ctx;
    ctx = undefined;
  }

  if(phases.length) {
    async.eachSeries(phases, function(phase, next) {
      phase.run(ctx, next);
    }, cb);
  } else {
    process.nextTick(cb);
  }
};

/**
 * Get an array of phase identifiers.
 * @returns {String[]} phaseNames
 */

PhaseList.prototype.getPhaseNames = function() {
  return this._phases.map(function(phase) {
    return phase.id;
  });
};

/**
 * Register a phase handler for the given phase (and sub-phase).
 *
 * **Example**
 *
 * ```js
 * // register via phase.use()
 * phaseList.registerHandler('routes', function(ctx, next) { next(); });
 * // register via phase.before()
 * phaseList.registerHandler('auth:before', function(ctx, next) { next(); });
 * // register via phase.after()
 * phaseList.registerHandler('auth:after', function(ctx, next) { next(); });
 * ```
 *
 * @param {String} phaseName Name of an existing phase, optionally with
 *   ":before" or ":after" suffix.
 * @param {Function(Object, Function)} handler The handler function to register
 *   with the given phase.
 */
PhaseList.prototype.registerHandler = function(phaseName, handler) {
  var subphase = 'use';
  var m = phaseName.match(/^(.+):(before|after)$/);
  if (m) {
    phaseName = m[1];
    subphase = m[2];
  }
  var phase = this.find(phaseName);
  if (!phase) throw new Error('Unknown phase ' + phaseName);
  phase[subphase](handler);
};
