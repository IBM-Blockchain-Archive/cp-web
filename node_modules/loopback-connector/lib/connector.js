var debug = require('debug')('loopback:connector');

module.exports = Connector;

/**
 * Base class for LoopBack connector. This is more a collection of useful
 * methods for connectors than a super class
 * @constructor
 */
function Connector(name, settings) {
  this._models = {};
  this.name = name;
  this.settings = settings || {};
}

/**
 * Set the relational property to indicate the backend is a relational DB
 * @type {boolean}
 */
Connector.prototype.relational = false;

/**
 * Check if the connector is for a relational DB
 * @returns {Boolean} true for relational DB
 */
Connector.prototype.isRelational = function() {
  return this.isRelational ||
    (this.getTypes().indexOf('rdbms') !== -1);
};

/**
 * Get types associated with the connector
 * @returns {String[]} The types for the connector
 */
Connector.prototype.getTypes = function() {
  return ['db', 'nosql'];
};

/**
 * Get the default data type for ID
 * @param prop Property definition
 * @returns {Function} The default type for ID
 */
Connector.prototype.getDefaultIdType = function(prop) {
  /*jshint unused:false */
  return String;
};

/**
 * Get the metadata for the connector
 * @returns {Object} The metadata object
 * @property {String} type The type for the backend
 * @property {Function} defaultIdType The default id type
 * @property {Boolean} [isRelational] If the connector represents a relational
 * database
 * @property {Object} schemaForSettings The schema for settings object
 */
Connector.prototype.getMetadata = function() {
  if (!this._metadata) {
    this._metadata = {
      types: this.getTypes(),
      defaultIdType: this.getDefaultIdType(),
      isRelational: this.isRelational(),
      schemaForSettings: {}
    };
  }
  return this._metadata;
};

/**
 * Execute a command with given parameters
 * @param {String|Object} command The command such as SQL
 * @param {*[]} [params] An array of parameter values
 * @param {Object} [options] Options object
 * @param {Function} [callback] The callback function
 */
Connector.prototype.execute = function(command, params, options, callback) {
  throw new Error('execute() must be implemented by the connector');
};

/**
 * Get the model definition by name
 * @param {String} modelName The model name
 * @returns {ModelDefinition} The model definition
 */
Connector.prototype.getModelDefinition = function(modelName) {
  return this._models[modelName];
};

/**
 * Get connector specific settings for a given model, for example,
 * ```
 * {
 *   "postgresql": {
 *     "schema": "xyz"
 *   }
 * }
 * ```
 *
 * @param {String} modelName Model name
 * @returns {Object} The connector specific settings
 */
Connector.prototype.getConnectorSpecificSettings = function(modelName) {
  var settings = this.getModelDefinition(modelName).settings || {};
  return settings[this.name];
};

/**
 * Get model property definition
 * @param {String} modelName Model name
 * @param {String} propName Property name
 * @returns {Object} Property definition
 */
Connector.prototype.getPropertyDefinition = function(modelName, propName) {
  var model = this.getModelDefinition(modelName);
  return model && model.properties[propName];
};

/**
 * Look up the data source by model name
 * @param {String} model The model name
 * @returns {DataSource} The data source
 */
Connector.prototype.getDataSource = function(model) {
  var m = this.getModelDefinition(model);
  if (!m) {
    debug('Model not found: ' + model);
  }
  return m && m.model.dataSource;
};

/**
 * Get the id property name
 * @param {String} model The model name
 * @returns {String} The id property name
 */
Connector.prototype.idName = function(model) {
  return this.getDataSource(model).idName(model);
};

/**
 * Get the id property names
 * @param {String} model The model name
 * @returns {[String]} The id property names
 */
Connector.prototype.idNames = function(model) {
  return this.getDataSource(model).idNames(model);
};

/**
 * Get the id index (sequence number, starting from 1)
 * @param {String} model The model name
 * @param {String} prop The property name
 * @returns {Number} The id index, undefined if the property is not part
 *   of the primary key
 */
Connector.prototype.id = function(model, prop) {
  var p = this.getModelDefinition(model).properties[prop];
  return p && p.id;
};

/**
 * Hook to be called by DataSource for defining a model
 * @param {Object} modelDefinition The model definition
 */
Connector.prototype.define = function(modelDefinition) {
  modelDefinition.settings = modelDefinition.settings || {};
  this._models[modelDefinition.model.modelName] = modelDefinition;
};

/**
 * Hook to be called by DataSource for defining a model property
 * @param {String} model The model name
 * @param {String} propertyName The property name
 * @param {Object} propertyDefinition The object for property definition
 */
Connector.prototype.defineProperty = function(model, propertyName, propertyDefinition) {
  var modelDef = this.getModelDefinition(model);
  modelDef.properties[propertyName] = propertyDefinition;
};

/**
 * Disconnect from the connector
 * @param {Function} [cb] Callback function
 */
Connector.prototype.disconnect = function disconnect(cb) {
  // NO-OP
  if (cb) {
    process.nextTick(cb);
  }
};

/**
 * Get the id value for the given model
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @returns {*} The id value
 *
 */
Connector.prototype.getIdValue = function(model, data) {
  return data && data[this.idName(model)];
};

/**
 * Set the id value for the given model
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {*} value The id value
 *
 */
Connector.prototype.setIdValue = function(model, data, value) {
  if (data) {
    data[this.idName(model)] = value;
  }
};

/**
 * Test if a property is nullable
 * @param {Object} prop The property definition
 * @returns {boolean} true if nullable
 */
Connector.prototype.isNullable = function(prop) {
  if (prop.required || prop.id) {
    return false;
  }
  if (prop.nullable || prop['null'] || prop.allowNull) {
    return true;
  }
  if (prop.nullable === false || prop['null'] === false ||
    prop.allowNull === false) {
    return false;
  }
  return true;
};

/**
 * Return the DataAccessObject interface implemented by the connector
 * @returns {Object} An object containing all methods implemented by the
 * connector that can be mixed into the model class. It should be considered as
 * the interface.
 */
Connector.prototype.getDataAccessObject = function() {
  return this.DataAccessObject;
};

/*!
 * Define aliases to a prototype method/property
 * @param {Function} cls The class that owns the method/property
 * @param {String} methodOrPropertyName The official property method/property name
 * @param {String|String[]} aliases Aliases to the official property/method
 */
Connector.defineAliases = function(cls, methodOrPropertyName, aliases) {
  if (typeof aliases === 'string') {
    aliases = [aliases];
  }
  if (Array.isArray(aliases)) {
    aliases.forEach(function(alias) {
      if (typeof alias === 'string') {
        Object.defineProperty(cls, alias, {
          get: function() {
            return this[methodOrPropertyName];
          }
        });
      }
    });
  }
};

/**
 * `command()` and `query()` are aliases to `execute()`
 */
Connector.defineAliases(Connector.prototype, 'execute', ['command', 'query']);




