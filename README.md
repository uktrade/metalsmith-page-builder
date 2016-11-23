# metalsmith-page-builder
Metalsmith plugin to build static website driven by json structure files.

## Table of contents

* [Purpose](#purpose)
* [Structure file](#structure-file)

## Purpose

Page builder is an alternative approach to Metalsmith's way of rendering markdown content using layouts. Page builder decouples markdown content and layout to allow content to be **re-usable** to form a base for a content centric flat html cms system. 

Intended to be used with IIGB cms system that generates structure files that is processable with page builder as shown below.

## Usage example

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
