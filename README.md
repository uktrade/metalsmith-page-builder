# metalsmith-page-builder
Metalsmith plugin to build static website driven by iigb website structure files.

## Table of contents

* [Purpose](#purpose)
* [Structure file](#structure-file)

## Purpose

Page builder provides way to render existing layouts (html) using markdown content with front-matter.This in turn allows existing content to be **re-usable** with multiple layouts to create static web pages.

Intended to be used with IIGB cms system that generates structure files that is processable with metalsmith-structure-parser as shown below.

## Structure file

Structure file are plain json files defining page hierarchy. 

Example scenario below uses nunjucks template engine with Metalsmith layouts plugin to build a static website.

**Project structure**

``` 
  content/
    abot_us.md
    intro.md
  templates/
    base/
      index.html
    partials
      nav.html
    home.html
    about_us.html
  structure/
    structure.json
  build/
```

To create the homepage as `home/index.html` under build folder using layout `home.html` with contents `intro.md` and `about_us.md` and an about us page as `home/about_us/index.html` structure file should look like as follows:

```
structure.json
---------------

{
  "globalMeta": {
    "locale": {
      "language": "en",
      "country": "uk"
    }
  },
  "pages": [{
    "path": "home",
    "output": "index.html",
    "layout": "home.html",
    "meta": {
      "pageTitle": "Home"
    },
    "contentBlocks": {
      "intro": {
        "file": "intro.md",
        "meta": {
          "link": "/about_us"
        }
      },
      "aboutUs":{
        "file":"about_us.md"
      }
    },
    "children" : [{
      "path": "about_us",
      "layout": "about_us.html",
      "meta": {
        "pageTitle": "About US"
      },
      "contentBlocks": {
        "aboutUS": {
          "file": "about_us.md"
        }
      }
      }]
    }]
}
```

* Page entries are defined using `pages`.
* `output` is optional. index.html is default output file name if not given for all page entries.
* Use `children` to create a nested folder structure
* Meta data can be added to each page entry and content block using `meta` key.
* Meta data added using `globalMeta` is accessible for all page entries
