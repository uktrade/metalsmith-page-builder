'use strict';

/**
 * Dependencies
 */
var metalsmith = require('metalsmith');
var json = require('metalsmith-json');
var path = require('path');
var fs = require('fs');
var version = require('../package.json').version;

/**
 * Helpers
 */
var logger = require('./helpers/logger')('metalsmith-page-builder');
var debug = logger.debug;
var warn = logger.warn;
var error = logger.error;

var CONTENT_KEY = 'content';

/**
 * Expose `plugin`.
 */
module.exports = PageBuilder;


/**
 * Metalsmith plugin to parse path structure.
 *
 * Parses each {locale}.json file under structure folder
 * and puts mapped content data into releavent page entries.

 *
 * @param  {Object} opts options
 * @return {Function}
 */
function PageBuilder(options) {
  return parseStructure;

  /**
   * Using contents supplied by metalsmith-markdown plugin, parser replaces actual content with content
   * path defined with content key in data object for earch page entries
   *
   * The parser clears supplied markdown and html files (@param contents) and supplies each page entry as an index.html
   * (by default if output is not defined) to be created by metalsmith.
   * Each page entry can have multiple contents mapped to it as data object properties with content key as file path.
   *
   * The resulting file list can be processed using markdown-layouts plugin.
   *
   * @param  {Object}   contents markdown or html files
   * @param  {[type]}   msmith   metalsmith
   * @param  {Function} done     callback
   */
  function parseStructure(contents, msmith, done) {
    var workingDidr = msmith._directory;
    var structureDirectory = options.structures || './structure';

    debug('Structures files -- %s', path.join(workingDidr, structureDirectory));

    parse();

    function parse() {
      var results = {}; //resulting file to replace content file list

      metalsmith(workingDidr)
        .source(structureDirectory)
        .use(json())
        .process(function(err, structureFiles) {
          if (err) {
            return done(err);
          }
          try {
            parseStructure();
            clearContentFiles(contents);
            extend(contents, results); //push index.html files into file list
            debug('Finished parsing structure successfully .');
            done();
          } catch (err) {
            error(err);
            done(err);
          }

          function parseStructure() {
            Object.keys(structureFiles)
              .forEach(function(structure) {
                if (isJson(structure)) {
                  debug('File: [%s]', structure);
                  processStructure(structureFiles[structure], results);
                } else {
                  debug('Skip: [%s]', structure);
                }
              });
          }
        });
    }

    /**
     * Clear content files (namely .html files in file list)
     * to no to be copied over to build.
     *
     * Note: Since markdown files are expected to be processed before
     * they also will have .htm extension
     *
     * @param  {Object} obj the object
     */
    function clearContentFiles(obj) {
      Object.keys(obj).forEach(function(key) {
        delete obj[key];
      });
    }

    /**
     * Extend object properties with another given object
     * @param  {Object} source      source object
     * @param  {[type]} destination destionation object
     */
    function extend(source, destination) {
      if (!destination) {
        return;
      }
      Object.keys(destination).forEach(function(key) {
        source[key] = destination[key];
      });
    }


    function processStructure(structure, results) {
      var data = structure.data;
      if (!data) {
        return;
      }
      var structureRoot = {
        path: '',
        breadcrumb: []
      };

      var globalData = parseGlobalData(structure.data.globalData);
      parsePages(structure.data.pages, structureRoot);

      function parsePages(pages, parent) {
        for (var i = 0; i < pages.length; i++) {
          var page = pages[i];
          page.path = buildPath(page, parent.path);
          page.version = version;
          var filePath = page.path + (page.output || 'index.html');

          debug('Page: %s', filePath);

          //put new page to resulting file list
          page = inflatePageContent(page, parent);
          results[filePath] = page;

          //Process sub pages
          if (page.children) {
            parsePages(page.children, page);
            delete page.children;
          }
        }
      }

      function parseGlobalData(globalData) {
        var _global = globalData || {};
        var currentData;
        Object.keys(_global).forEach(function(key) {
          currentData = _global[key];
          if (hasContent(currentData)) {
            loadContent(currentData);
          }
        });

        return _global;
      }


      /**
       * Load defined contents,  adds path, breadcrumb, timestamp
       * and transform page object to a metalsmith processable file entry
       *
       * @return {Object} inflated page entry
       */
      function inflatePageContent(page, parent) {
        page.timestamp = Date.now() / 1000 | 0;
        extend(page, globalData); // extend page with globalData

        if (!page.data) {
          return;
        }

        page.breadcrumb = parent.breadcrumb.concat({
          pageTitle: page.data.pageTitle,
          link: '/' + page.path
        });

        // debug('Breadcrumb: %j', page.path, page.breadcrumb);
        var data = page.data || {};
        var filePath;

        //Inject markdown content to element in contentBlock
        Object.keys(data).forEach(function(key) {
          var block = data[key];
          loadContent(block);
        });

        //hoist every data definition to page entry and clear data
        // to make all data definitions using page.key rather than page.data.key
        extend(page, data);
        delete page.data;

        //metalsmith layouts skips file entries with non-utf8 or empty contents.
        //This will make it work
        page.contents = '';
        return page;
      }
    }


    /**
     * Loads content if block is an object or array of objects with content key as markdown file path.
     * Otherwise leaves block as it is.
     */
    function loadContent(block) {
      if (isArray(block)) {
        for (var i = 0; i < block.length; i++) {
          loadContent(block[i]);
        }
      }
      if (!hasContent(block)) {
        return;
      }

      var cPath = block[CONTENT_KEY];
      if (!cPath) { //if not file path for content is given skip
        return;
      }
      var p = path.parse(cPath);
      var contentPath = (p.dir ? p.dir + path.sep : '') + p.name;
      //content files are transformed into html after markdown process
      var content = contents[contentPath + '.html'];
      if (content) {
        if (content.contents) {
          content.contents = content.contents.toString(); //buffer to string

          //Prose inserts images with {{site.basUrl}} prefix. Having the media folder
          //of the content under root of the build, {{site.baseUrl}} needs to be removed from markdown content
          content.contents = content.contents.replace('{{site.baseurl}}', '');
        }

        //if hoist flag is set hoist the content to block level instead of keeping as content object
        if (block.hoist) {
          debug('Hoist: %s', cPath);
          extend(block, content);
          delete block[CONTENT_KEY];
        } else {
          block[CONTENT_KEY] = content; //replace path with loaded content
        }
      } else {
        throw 'Content not found ' + cPath;
      }
    }



    /**
     * Checks if given  data has a content definition
     * @param  {[type]}  block object with content key as file path
     * @return {Boolean} if there is content definition
     */
    function hasContent(block) {
      return isObject(block) && block[CONTENT_KEY];
    }


    function isArray(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    }

    function isObject(obj) {
      return typeof obj === 'object';
    }


    /**
     * Builds path by appending page path to parent path
     * @param  {Object} page       page entry
     * @param  {String} parentPath parent page path
     * @return {String}            resulting path
     */
    function buildPath(page, parentUrl) {
      var p;
      p = parentUrl + (page.path || '');

      return trail(p);

      //add trailing slash to path
      function trail(p) {
        //paths should be ralative to build folder
        if (!p) {
          return './';
        } else if (p.endsWith('/')) {
          return p;
        }
        return p + path.sep;
      }
    }

    function isJson(file) {
      return /\.json$/.test(path.extname(file));
    }

  }
}
