var assert = require('assert');
var PLACEHOLDER = '?';

module.exports = ParameterizedSQL;

/**
 * A class for parameterized SQL clauses
 * @param {String|Object} sql The SQL clause. If the value is a string, treat
 * it as the template using `?` as the placeholder, for example, `(?,?)`. If
 * the value is an object, treat it as {sql: '...', params: [...]}
 * @param {*[]} params An array of parameter values. The length should match the
 * number of placeholders in the template
 * @returns {ParameterizedSQL} A new instance of ParameterizedSQL
 * @constructor
 */
function ParameterizedSQL(sql, params) {
  if (!(this instanceof ParameterizedSQL)) {
    return new ParameterizedSQL(sql, params);
  }
  sql = sql || '';
  if (arguments.length === 1 && typeof sql === 'object') {
    this.sql = sql.sql;
    this.params = sql.params || [];
  } else {
    this.sql = sql;
    this.params = params || [];
  }
  assert(typeof this.sql === 'string', 'sql must be a string');
  assert(Array.isArray(this.params), 'params must be an array');

  var parts = this.sql.split(PLACEHOLDER);
  assert(parts.length - 1 === this.params.length,
    'The number of ? (' + (parts.length - 1) +
    ') in the sql (' + this.sql + ') must match the number of params (' +
    this.params.length +
    ') ' + this.params);
}

/**
 * Merge the parameterized sqls into the current instance
 * @param {Object|Object[]} ps A parametered SQL or an array of parameterized
 * SQLs
 * @param {String} [separator] Separator, default to ` `
 * @returns {ParameterizedSQL} The current instance
 */
ParameterizedSQL.prototype.merge = function(ps, separator) {
  if (Array.isArray(ps)) {
    return this.constructor.append(this,
      this.constructor.join(ps, separator), separator);
  } else {
    return this.constructor.append(this, ps, separator);
  }
};

ParameterizedSQL.prototype.toJSON = function() {
  return {
    sql: this.sql,
    params: this.params
  };
};

/**
 * Append the statement into the current statement
 * @param {Object} currentStmt The current SQL statement
 * @param {Object} stmt The statement to be appended
 * @param {String} [separator] Separator, default to ` `
 * @returns {*} The merged statement
 */
ParameterizedSQL.append = function(currentStmt, stmt, separator) {
  currentStmt = (currentStmt instanceof ParameterizedSQL) ?
    currentStmt : new ParameterizedSQL(currentStmt);
  stmt = (stmt instanceof ParameterizedSQL) ? stmt :
    new ParameterizedSQL(stmt);
  separator = typeof separator === 'string' ? separator : ' ';
  if (currentStmt.sql) {
    currentStmt.sql += separator;
  }
  if (stmt.sql) {
    currentStmt.sql += stmt.sql;
  }
  currentStmt.params = currentStmt.params.concat(stmt.params);
  return currentStmt;
};

/**
 * Join multiple parameterized SQLs into one
 * @param {Object[]} sqls An array of parameterized SQLs
 * @param {String} [separator] Separator, default to ` `
 * @returns {ParameterizedSQL}
 */
ParameterizedSQL.join = function(sqls, separator) {
  assert(Array.isArray(sqls), 'sqls must be an array');
  var ps = new ParameterizedSQL('', []);
  for (var i = 0, n = sqls.length; i < n; i++) {
    this.append(ps, sqls[i], separator);
  }
  return ps;
};

ParameterizedSQL.PLACEHOLDER = PLACEHOLDER;

