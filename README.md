AlyOCS
======

Aliyun Open Cache Service

## Installation

    $ npm install AlyOCS

## Options

  - `host` 
  - `ocsKey`
  - `ocsSecret`

## Example

  var session = require("express-session");
  var AlyOCS  = require("AlyOCS")(session);
  app.use(session(
    {
      store: new AlyOCS(options), 
      secret: settings.cookie_secret
    })
  );
