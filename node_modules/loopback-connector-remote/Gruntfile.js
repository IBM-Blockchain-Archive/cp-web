// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-connector-remote
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*global module:false*/
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
      '<%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    jshint: {
      options: {
        jshintrc: true
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      libTest: {
        src: ['lib/**/*.js', 'test/**/*.js']
      }
    },
    mochaTest: {
      'unit': {
        src: 'test/*.js',
        options: {
          reporter: 'dot'
        }
      },
      'unit-xml': {
        src: 'test/*.js',
        options: {
          reporter: 'xunit',
          captureFile: 'xunit.xml'
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('default', ['test']);

  grunt.registerTask('test', [
    process.env.JENKINS_HOME ? 'mochaTest:unit-xml' : 'mochaTest:unit']);
};
