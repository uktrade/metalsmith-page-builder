# metalsmith-page-builder
Metalsmith plugin to build static website driven by json structure files.

## Table of contents

* [Purpose](#purpose)
* [Structure](#structure)
* [Example](#example)

## Purpose

Page builder is an alternative approach to Metalsmith's way of rendering markdown content using layouts. Page builder decouples markdown content and layout to allow content to be **re-usable** to form a base for a content centric flat html cms system. 

Intended to be used with IIGB cms system that generates structure files that is processable with page builder as shown below.

## Structure

* Structure file `data` and `globalData` fields are accessible by template engines. Below example shows mustache style access in template engine context.
* `content` keyword must be a path to a [metalsmith-makrdown](https://github.com/segmentio/metalsmith-markdown) processable file (e.g. markdown, html with yaml front-matter ). Markdown files are loaded and replaced with markdown path entry.
* If `"hoist" : true` flag is set, contents of the file are available using property key; rather than  using `{{property.content.someMetaInContentFile}}` you will use  `{{property.someMetaInContentFile}}`. Only effective if file content is loaded.
* `pages` must be an array of objects defining page properties
  - `output` key changes the file name generated. If not given `index.html` is used
  - `children` defines array of sub pages. Each page in children array will be created under path parent-path/child-path/index.html (assuming there is not output property set for file name). 

```
{
  "globalData": { //Data that is shared for all page entries
    "property": "value", // accessible with template engine as {{property}}
    "anotherProperty": {
      "someValue": "value" 
    },
    "yetAnotherProperty" : {
      "content": "path/to/content.md" //loaded from content.md file
    },
    "oneOtherProperty" : {
      "content": "another/path/to/content.md",
      "hoist": true //hoists markdown file content to extend oneOtherProperty
    }
  },
  "pages": [ //Page entries
    { 
      "path": "path-of-the-page",
      "layout": "some.html",//layout to render page with
      "output": "page.html",//generates path-of-the-page/page.html in build dir
      "data": { //page context data, accessible by only this page
        "myData": "testData",//access using {{myData}}
        "someContent": {
          "someMetaKey": ["value1", "value2"]
          "content": "/path/to/file.html",
          "hoist":true //makes content file meta accessible as {{someContent.metaKey}}
        }
      },
      "children":[ //child page entries.
        {
          "path": "child1",
          .
          .
          .
          
        }
      ]
    }
  ]
}
```

## Example

Structure files are plain json files defining page hierarchy. 

Example scenario below uses nunjucks template engine with Metalsmith layouts plugin to build a static website.

**Project structure**

``` 
  content/
    abot_us.md
    intro.md
    labels.md
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

Structure file should look like below to create a homepage as `home/index.html` under build folder using layout `home.html` with contents `intro.md` and `about_us.md` and an about us page as `home/about_us/index.html`


**structure.json**
```
{
  "globalData": {
    "locale": {
      "language": "en",
      "country": "uk",
    },
    "labels": {
      "content": "labels.md"
    }
  },
  "pages": [{
    "path": "home",
    "output": "index.html",
    "layout": "home.html",
    "data": {
      "pageTitle": "Home",
      "intro": {
        "content": "intro.md"
      },
      "aboutUs":{
        "content":"about_us.md",
        "link": "/about_us"
      }
    },
    "children" : [{
      "path": "about_us",
      "layout": "about_us.html",
      "data": {
        "pageTitle": "About US",
        "aboutUS": {
          "content": "about_us.md"
        }
      }
      }]
    }]
}
```


**intro.md**
```
---
title: Hello
name: World
---

Lorem ipsum...

```

**about_us.md**
```
---
summary: Lorem ipsum...
---

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod....
```

**index.html**
```
<!DOCTYPE html>
<!-- Using global data definition locale -->
<html lang="{{locale.language}}"> 
<head>
  <meta charset="UTF-8">
  <!-- Using page title defined in page meta data -->
  <title>{{pageTitle}}</title>
</head>
<body>
  {% block content %}

  {% endblock %}
</body>
</html>

```


**home.html**
```
{% extends "base/index.html" %}

{% block content %}

  {% include "partials/nav.html" %}
  
  <!-- Using named content block intro -->
  {{intro.content.title }} {{ intro.content.name}}
  {{intro.content.contents | safe}}

  <!-- Using named content block aboutUs -->
  {{aboutUs.content.summary}}
  <a href="{{aboutUs.link}}"> See more </a>

{% endblock %}

```


**about_us.html**
```
{% extends "base/index.html" %}

{% block content %}

  <!-- Using named content aboutUs -->
  {{aboutUs.content.contents | safe}}
  
```
