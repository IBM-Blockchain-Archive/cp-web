2015-07-29, Version 2.3.0
=========================

 * Fix RegExp coercion (Simon Ho)

 * Add support for RegExp operator (Simon Ho)

 * Add a test for nesting and/or (Raymond Feng)


2015-06-23, Version 2.2.2
=========================

 * Enable Inversion of Control in connector hooks through modifications of the context object. (Frank Steegmans)


2015-05-27, Version 2.2.1
=========================

 * Fix the callback (Raymond Feng)


2015-05-27, Version 2.2.0
=========================

 * Update deps (Raymond Feng)

 * Add hooks to sql based connectors (Raymond Feng)


2015-05-22, Version 2.1.2
=========================

 * Fix for https://github.com/strongloop/loopback-connector-mssql/issues/45 (Raymond Feng)

 * Fix the jsdoc for applyPagination (Raymond Feng)


2015-05-20, Version 2.1.1
=========================

 * Fix for https://github.com/strongloop/loopback-connector-postgresql/issues/80 (Raymond Feng)


2015-05-18, Version 2.1.0
=========================

 * Update sql-connector.md (Rand McKinney)

 * Add tests for propagating a transaction over relations (Raymond Feng)

 * Add transaction support (Raymond Feng)


2015-05-18, Version 2.0.1
=========================

 * Replace with link to Confluence (Rand McKinney)

 * Update sql-connector.md (Rand McKinney)


2015-05-13, Version 2.0.0
=========================

 * Upgrade deps (Raymond Feng)

 * Make sure invalid fields are filtered out (Raymond Feng)

 * Refactor base and sql connector (Raymond Feng)

 * Update README.md (Paulo McNally)


2015-01-28, Version 1.2.1
=========================

 * package: add jshint to devDependencies (Miroslav Bajtoš)

 * Fix crash in `id(model, property)` (Miroslav Bajtoš)

 * Fix bad CLA URL in CONTRIBUTING.md (Ryan Graham)


2014-10-13, Version 1.2.0
=========================

 * Bump version (Raymond Feng)

 * Make sure callback happens if a model is not attached to the data source (Raymond Feng)

 * Update contribution guidelines (Ryan Graham)


2014-07-20, Version 1.1.1
=========================

 * Bump version (Raymond Feng)

 * Fix updateAttributes impl (Raymond Feng)


2014-06-20, Version 1.1.0
=========================

 * Bump version (Raymond Feng)

 * Fix style to pass jlint (Raymond Feng)

 * Add space (Raymond Feng)

 * Add bulk update support (Raymond Feng)

 * Fix the count() impl to use buildWhere() from the subclass (Raymond Feng)


2014-06-03, Version 1.0.0
=========================

 * First release!
