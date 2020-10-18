# app-agent

Make app objects consumable by loggers and reporters

## WIP

Not yet ready.

## Why?

I want to have separate routines for logging and reporting,
well-integrated with execution environment.

Logging:

```javascript
console.log (...format`${this} just launched`);
```

Logging and reporting:

```javascript
console.log (...report`${this} just launched`);
```

Just reporting:
```javascript
report`${this} just launched`;
```

Result? Browser will have proper caller and stringified message with browsable object, reporter will have human–readable and machine–readable log messages.

## Usage

```javascript
// use with defaults
import {format, report} from 'app-agent';

console.log (...report`${this} just launched`);

// customize
import agent from 'app-agent';

// verbose setting once per app, also supports env vars
agent.mute ('Loader');
agent.only ('Loader');

// 
agent

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
 * You can turn off logging per class by class name;