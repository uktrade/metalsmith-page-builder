'use strict';


var metalsmith = require('metalsmith'),
  markdown = require('metalsmith-markdown'),
  layouts = require('metalsmith-layouts'),
  nunjucks = require('nunjucks'),
  pageBuilder = require('../lib');

var logger = require('../lib/helpers/logger')('test');
var debug = logger.debug;
// var warn = logger.warn;


build();

function build() {
  debug('%j', process);

  var m = metalsmith(process.cwd())
    .source('content')
    .use(markdown())
    .use(pageBuilder({
      structures: './structure' //structure files dir
    }))
    .use(layouts({
      engine: 'nunjucks',
      directory: './layout'
    }))
    .destination('./build')
    .build(function(err) {
      if (err) {
        throw (err);
      } else {
        debug('Build finished successfully!');
      }
    });

}
