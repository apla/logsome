# LOGSOME

App objects consumable by loggers and reporters

## TL;DR

Code:

```javascript
const array = [1,2,3];
const str   = "aaa";
const obj   = {a: 1, b: 2, c: 3};
console.log (...report`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`);
```

Node.js console:

![](https://github.com/apla/logsome/blob/docs/logsome-console.jpg?raw=true)

Browser console:

![](https://github.com/apla/logsome/blob/docs/logsome-safari.jpg?raw=true)

Loggly:

![](https://github.com/apla/logsome/blob/docs/logsome-loggly.jpg?raw=true)

## Install

import for browser:

```javascript
import {format,  endpoint} from "https://cdn.jsdelivr.net/npm/logsome@latest/logsome.js";
```

install for node:

```sh
npm i -D logsome
```

then use esm

```javascript
import {format, endpoint} from 'logsome';
```

or cjs

```javascript
const {format, endpoint} = require('logsome');
```

## Why?

 1. Human readable logs with attached machine readable objects
 4. Can be used for plain text console logs and remote server json logs
 3. Caller information not screwed up

Works in the [browser (Chrome 62+, Safari 11+, Firefox 53+) and in the Node.js (8.10+)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#browser_compatibility)


## Usage

```javascript
// log formatting
import {format} from 'logsome';

console.log (...format`${this} just launched`);

// TODO: not yet implemented
// mute unneeded logs in console
// verbose setting once per app, also supports env vars
// logsome.mute ('Loader');
// logsome.only ('Loader');

import {endpoint} from 'logsome';

// configure API endpoint once
const sender = endpoint('https://site.com/api/v1/log', {name: 'remote'});

// use everywhere
const sendR1 = endpoint('remote');

// send something
console.log(...sendR1`${this} just launched`);

// void endpoint to temporarily disable remote endpoint
endpoint(`void:`, {name: 'base'});
const sendR2 = endpoint('base');

// loggly endpoint for demonstation purposes
endpoint(`loggly:${logglyToken}`, {name: 'loggly'});
const sendR3 = endpoint('loggly');

```

## API

### format\`template\`

Format and returns array, consumable by `console.log`

### endpoint(url, [options]) => report
### endpoint(urlOrName) => report

Creates or gets reporting object for endpoint. Custom url protocols can be used to simplify setup. Take a look at `loggly` string in the `logsome.js`. `void:` protocol can be used to avoid data submission.

### report\`template\`

Format message for log and send it to the endpoint.

If `report` function imported, then it only can send data through default endpoint. Default endpoint have `.name` = '' or if there is no other enpoints configured. Throws error with `.code` = `NO_DEFAULT_ENDPOINT` if no default endpoint configured. `void:` endpoint not counting as configured endpoint.

If `report` received as a result of `endpoint` call, it is bound to that endpoint.

Returned array contains `.sending` thenable property. Usually it is not needed for long running scripts.

### styles

Style description for displaying different objects

### locators

Locator methods to support custom url schemes.

### custom objects

When object have `Symbol.for('logsome')` method, returned custom in the `title` and `style`
keys will be displayed instead of standard ones. Function at `facade` key
will be called and result is used instead of object. No one can tell what should be reported.List safe fields and avoid any sensitive data leak. Skip extra fields to reduce bandwith.

Modern browsers and Node.js supports `Symbol.toStringTag`, but it is almost unusable
due differences between node and browsers. First of all, browsers won't display
`Symbol.toStringTag` when inspecting objects in console. It is displayed only
when object stringified. Node.js displays `Symbol.toStringTag` in square brackets
after class name.

## Notes

### Browser: Rollup & Buble integration

Seems like `buble` and `@rollup/plugin-buble` cannot parse string like `return import(…`.

Requires adding replacement plugin with configuration like this:

```javascript
replace({
    preventAssignment: true,
    delimiters: ['\\b', '\\b(?=\\s*\\()'],
    values: {
        import: '_import'
    }
}),
```

### TODO: Comparison

https://geshan.com.np/blog/2021/01/nodejs-logging-library/
https://github.com/pinojs/pino/blob/master/docs/benchmarks.md

### TODO: Web UI

https://github.com/guigrpa/storyboard
