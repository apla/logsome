# LOGSOME

Make app objects consumable by loggers and reporters

## WIP

Not yet ready.

## Why?

I want to have separate routines for console and remote service,
well-integrated with execution environment.

Log to console:

```javascript
console.log (...format`${this} just launched`);
```

Log to console and remote:

```javascript
console.log (...send`${this} just launched`);
```

Just remote:

```javascript
send`${this} just launched`;
```

Result? Browser will have proper caller and stringified message with browsable object, reporter will have human–readable and machine–readable log messages.

## Usage

```javascript
// log formatting
import {format} from 'logsome';

console.log (...format`${this} just launched`);

// mute unneeded logs in console
import logsome from 'logsome';

// verbose setting once per app, also supports env vars
logsome.mute ('Loader');
logsome.only ('Loader');

import logsome from 'logsome';

// configure API endpoint once
const sendR1 = logsome.server ('remote', 'https://site.com/api/v1/log');

// use everywhere
const send = logsome.server ('remote');

// send something
console.log (...send`${this} just launched`);

```

## Environments

### Browser

Just works for any modern browser. 

### node.js

Not released yet.

## Features

No one can tell what should be reported. List safe fields and avoid any sensitive data leak. Skip extra fields to reduce bandwith.

 * Logging object should describe it's own stringified version with `toString()` and report fields with `toJSON()`;
 * Formatting and reporting configurable per object (but please use class instances);
 * You can turn off logging per class by class name ([WHATWG spec](https://console.spec.whatwg.org/#logger));
