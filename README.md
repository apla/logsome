# LOGSOME

App objects consumable by loggers and reporters

## TL;DR

```javascript
const array = [1,2,3];
const str   = "aaa";
const obj   = {a: 1, b: 2, c: 3};
console.log (...format`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`);
```

Node.js console

![](https://github.com/apla/logsome/blob/docs/logsome-console.jpg?raw=true)

Browser console

![](https://github.com/apla/logsome/blob/docs/logsome-safari.jpg?raw=true)

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

## Features

No one can tell what should be reported. List safe fields and avoid any sensitive data leak. Skip extra fields to reduce bandwith.

 * Logging object can describe it's own stringified version with `toString()` and report fields with `toJSON()` (node have [`util.inspect.custom`](https://nodejs.org/api/util.html#utilinspectobject-showhidden-depth-colors));
 * Formatting and reporting configurable per object (but please use class instances);
 * TODO: You can turn off logging per class by class name ([WHATWG spec](https://console.spec.whatwg.org/#logger));

### Rollup & Buble integration

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
