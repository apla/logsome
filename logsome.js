/**
 * @typedef {Object} FormatStyle
 * styles
 * @property {String}  common common style for every type
 * @property {String}  object style for objects
 * @property {String}  array  style for arrays
 * @property {String}  fn     style for functions
 * @property {String}  clear  style clear
 * @property {Number}  maxArrayLength max array element count to inline
 * @property {Number}  maxStringLength max string length to inline
 * @property {Boolean} stringify stringify objects using toJSON method
 * @property {String}  objectSeparator separator between log string and objects dump
 * @property {Boolean} supportsPercent log environment supports percent notation such as %s %o
 * @property {String}  styledTemplate style template
 * @property {Boolean} collectArgs collect args into single structure
 * @property {Boolean} [ignoreFnFormat=false] ignore function formatting, don't show any complaint about it
 */

/**
 * Prepare single argument for console
 * @description
 * This function can return the value, in that case value
 * will be inserted into log message. Or, `argDumper` can return
 * percent format and push value to the fills. In that case,
 * `arg` will be formatted according to the format specifier.
 * Additionally, you can add some value to the `tail`.
 * For console, tail will be displayed after the log message,
 * for server data it will be the part of the payload.
 * @param {FormatStyle} style formatting styles
 * @param {*} arg template string arg
 * @param {Number} index arg index
 * @param {any[]} fills array of fills
 * @param {Array|Object} tail complex objects to dump
 * @param {String} [tailKey] tail key
 * @returns 
 */
function argDumper (style, arg, index, fills, tail, tailKey) {

	if (!arg) {
		if (style.supportsPercent) {
			fills.push (arg);
			return '%o';
		}
		return arg; // 0, false, undefined, null, NaN
	}

	if (typeof arg === 'function') {
		if (!style.ignoreFnFormat)
			console.trace ("You're logging a function. Why?");
		const fnName = (arg.name || 'anonymous');
		Array.isArray(tail) ? tail.push (arg) : tail[tailKey || fnName + '#' + index] = arg;
		
		const formatArgs = [
			[style.fn, style.common].join (''),
			fnName,
			style.clear
		];
		if (style.supportsPercent) fills.push (...formatArgs);

		return style.styledTemplate || formatArgs.join('');
	} else if (Array.isArray(arg)) {
		if (tailKey) {
			if (!Array.isArray(tail)) {
				tail[tailKey] = arg;
			}
		} else if (arg.length > style.maxArrayLength) {
			Array.isArray(tail) ? tail.push (arg) : tail['Array#' + index] = arg;
		}

		const formatArgs = [
			[style.array, style.common].join (''),
			// TODO: array values wrap
			`[${arg.slice(0, style.maxArrayLength)}${arg.length > style.maxArrayLength ? ',...' : ''}]`,
			style.clear
		];
		if (style.supportsPercent) fills.push (...formatArgs);

		return style.styledTemplate || formatArgs.join('');

	} else if (arg === Object(arg)) {
		const argConstructorName = arg.constructor.name;

		let customFormat, customClassPattern, customClassFormat;
		// some global classes can have own styles; TODO: compile patterns
		for (const [classPattern, classLogProps] of classFormats.all) {
			if (!argConstructorName.match(classPattern)) {
				continue;
			}

			customClassPattern  = classPattern;
			customClassFormat = classLogProps;
			break;
		}

		if (customClassPattern && customClassFormat && arg instanceof customClassFormat.classRef) {
			customFormat = customClassFormat;
		} else if (arg[Symbol.for('logsome')]) {
			customFormat = arg[Symbol.for('logsome')]();
		}

		const argKeys = Object.keys(arg);

		let tailValue = customFormat && customFormat.facade ? customFormat.facade() : arg;

		// TODO: maybe some heuristics to avoid false positives
		if (!customFormat && argConstructorName === 'Object' && argKeys.length === 1) {
			
			const tailKeyDesc = argKeys[0];
			tailValue = arg[tailKeyDesc];
			if (argKeys[0] === '_') {
				// _ is a specific key to add additional context for server
				if (!Array.isArray(tail)) {
					tail._ = tailValue;
				}
			} else {
				// avoid recursion with collectArgs
				return argDumper ({...style, collectArgs: false}, tailValue, index, fills, tail, tailKeyDesc);
			}
		} else {
			if (Array.isArray(tail)) {
				tail.push(tailValue);
			} else {
				tail[tailKey || argConstructorName + '#' + index] = tailValue;
			}

			const formatArgs = [
				[(customFormat && customFormat.style || {})[runtime] || style.object, style.common].join (''),
				customFormat && customFormat.title ? customFormat.title : argConstructorName,
				style.clear
			];
			
			if (style.supportsPercent) fills.push (...formatArgs);
	
			return style.styledTemplate || formatArgs.join('');
		}

	} else if (arg.constructor === String) { // typeof(arg) === 'string' || arg instanceof String
		if (tailKey && !Array.isArray(tail)) {
			tail[tailKey] = arg;
		}
		if (style.maxStringLength && arg.length > style.maxStringLength) {
			Array.isArray(tail) ? tail.push (arg) : tail[tailKey || 'String#' + index] = arg;
			return ['', arg.slice(0, style.maxStringLength) + '...', ''].join ('"');
		}
		return '"' + arg + '"'; // <string>
	} else {
		if (style.supportsPercent) {
			fills.push (arg);
			return '%o';
		}
		return arg; // true
	}
}

// TODO: return object from formatter,
// consume that object by consoleExporter and return list
// for console.* methods
/**
 * Format template string args
 * @param {Object} binding binding object
 * @param {FormatStyle} binding.style binding object
 * @param {Boolean} [binding.wantsObject] return object instead of array
 * @param {Readonly<String[]>} strings string chunks between interpolations
 * @param  {...any} args interpolations
 * @returns {Array|Object}
 */
export function formatter ({style, wantsObject}, strings, ...args) {
	
	// not a template string
	// TODO: check/split for %o
	if (!Array.isArray(strings) && strings) {
		return formatter({style, wantsObject}, Array.from({length: args.length + 2}, _ => ''), strings, ...args);
	}

	const logObject = {};
	const fills  = [];
	/** @type {Array|Object} */
	const tail = (style.collectArgs ? {} : []);
	const chunks = strings.reduce ((accum, str, idx, arr) => {
		if (arr.length - idx === 1) {
			accum.push(str);
			return accum;
		}
		
		const arg = args[idx];
		
		accum.push(str);
		accum.push(argDumper (style, arg, idx, fills, tail));
		
		return accum;
	}, []);

	if (style.collectArgs ? Object.keys(tail).length : tail.length) {
		chunks.push(style.objectSeparator);
	}

	if (wantsObject) {
		return {
			template: chunks.join (''),
			fills,
			tail,
		};
	}

	return style.collectArgs
		? [chunks.join (''), ...fills, tail]
		: [chunks.join (''), ...fills, ...tail];
}

/**
 * @type {'browser'|'node'} Current runtime
 */
export const runtime = globalThis.window ? 'browser' : 'node';

/**
 * @typedef  {Object} ClassCustomConfig
 * @property {Object} [classRef] class reference to match inherited classes, such as Error or Element
 * @property {Object} style styling for class
 * @property {Function} [facade] provides logging facade for class
 */

/**
 * @typedef {Object} ClassFormats
 * @property {Map<RegExp,ClassCustomConfig>} all all class formats
 * @property {Function} installPredefined install predefined formats for Error and Element
 * @property {(match: RegExp, config: ClassCustomConfig) => void} set sets the new class handler
 * @property {Function} clear clear all class formats
 */

/** @type {ClassFormats} */
export const classFormats = {
	all: new Map(),
	installPredefined() {
		classFormats.all.set(/Error$/, {
			classRef: Error, // just to ensure class match by class constructor, not name
			style: {browser: 'background-color: #f63;', node: '\x1b[31m'}
		});

		if (runtime === 'browser') {
			classFormats.all.set(/Element$/, {
				classRef: Element,
				style: {browser: 'background-color: #4ae;', node: '\x1b[37m'}
			});
		}	
	},
	set (match, config) {
		classFormats.all.set(match, config);
	},
	clear () {
		classFormats.all.clear();
	}
};


const roundedStyle = 'border-radius: 2px;';

/**
 * @type {Object<String,FormatStyle>}
 */
export const styles = {
	// browser environment
	browser: {
        common: roundedStyle,
        object: 'background-color: #fe9; color: #333; ',
	    array:  'background-color: #fc9; color: #333; ',
		fn:     'background-color: #3f9; color: #333; ',
		clear:  '',
		maxArrayLength: 5,
		maxStringLength: 50,
		objectSeparator: '',
		supportsPercent: true,
		styledTemplate: '%c%s%c', // quite ugly rounded corners
		collectArgs: false,
	},
	// node logs
	node: {
        common: '',
        object: '\x1b[35m',
	    array:  '\x1b[36m',
		fn:     '\x1b[33m',
		clear:  '\x1b[0m',
		maxArrayLength: 5,
		maxStringLength: 50,
		objectSeparator: ' ||| ',
		supportsPercent: true,
		styledTemplate: '%s%s%s',
		collectArgs: false,
	},
	// formatter to send logs to server
	server: {
        common: '',
        object: '',
	    array:  '',
		fn:     '',
		clear:  '',
		supportsPercent: false,
		jsonify: true,
		collectArgs: true,
	},
};

/**
 * Default formatter for current runtime
 * @type {(strings: Readonly<String[]>, ...args: any[]) => any[] | any}
 */
export const format = formatter.bind (null, {style: styles[runtime]});

/** @type {Object<String,(url: String) => LogsomeServer>} */
export const locators = {
	http (url) {
		return {
			url,
			data: {},
			options: {}
		}
	},
	https (url) {
		return {
			url,
			data: {},
			options: {}
		}
	}
};


/**
 * Send log messages from browser
 * @param {String} serverName server name
 * @param {Object} message text version of message to send
 * @param {Object | Array} fills 
 * @param {Object} data data payload to send
 * @returns {Promise}
 */
function sendingFromBrowser (serverName, message, fills, data) {

	const serverConfig = servers[serverName];

	const url = serverConfig.url;
	const serverOptions = serverConfig.options || {};
	const useBeacon = serverOptions.useBeacon;

	// TODO: use formatter
	const dataSerialized = JSON.stringify ({message, data});
	let dataToSend = dataSerialized;

	const contentType = (serverOptions.headers || {}).contentType || 'text/plain'; // 'multipart/mixed';  // 'application/x-www-form-urlencoded'; // 'application/json';
	if (
		window && window.Blob && window.navigator.sendBeacon
		&& useBeacon
	) {
		return new Promise (resolve => {
			// if (contentType === 'application/json') {
			// 	dataToSend = new Blob([ dataSerialized ], { type: contentType });
			// } else if (contentType === 'multipart/mixed') {
			// 	dataToSend = new FormData ();
			// 	dataToSend.append ('json', dataSerialized);
			// } else {
				dataToSend = dataSerialized;
			// }
			resolve (window.navigator.sendBeacon (url, dataToSend));
		});
	} else {
		return fetch (url, {
			method: serverOptions.method || 'POST',
			mode: 'no-cors',
			headers: {'Content-Type': contentType.toString()}, // fuck ts
			body: dataToSend,
		});
	}
}

/** @typedef {import('http').RequestOptions} RequestOptions */

/**
 * 
 * @param {import('https')} https http/https module
 * @param {String} url url
 * @param {RequestOptions} requestOptions request options
 * @param {String} dataToSend data to send
 * @returns {Promise}
 */
function requesting (https, url, requestOptions, dataToSend) {
	return new Promise((resolve, reject) => {

		let err;

		const req = https.request (url, requestOptions, (res) => {
		
			let body = Buffer.alloc (0);
			
			res.on ('data', chunk => body = Buffer.concat ([body, chunk]));
			res.on ('error', _err => (err = _err));
			res.on ('end', () => {
				if (err) {
					// console.error(body.toString(), err);
					reject (err);
				} else if (res.statusCode === 200) {
					resolve ({statusCode: res.statusCode, headers: res.headers, body: body});
				} else {
					reject ('Request failed. status: ' + res.statusCode + ', body: ' + body);
				}
			});
		});
		req.on('error', err => {
			reject(err);
		});
		req.write(dataToSend);
		req.end();

	});
}

/**
 * Send log messages from browser
 * @param {String} serverName server name
 * @param {Object} message text version of message to send
 * @param {Object | Array} fills 
 * @param {Object} data data payload to send
 * @returns {Promise}
 */
async function sendingFromNode (serverName, message, fills, data) {

	const serverConfig = servers[serverName];

	const url = serverConfig.url;
	const urlObject = new URL(url);

	const serverOptions = serverConfig.options || {};

	const contentType = (serverOptions.headers || {}).contentType || 'text/plain'; // 'multipart/mixed';  // 'application/x-www-form-urlencoded'; // 'application/json';

	// TODO: serialize using formatter
	const dataToSend = JSON.stringify({message, data});

	/** @type {RequestOptions} */
	// const requestOptions = {};
	const requestOptions = {
		method:  serverOptions.method || 'POST',
		headers: {'Content-Type': contentType},
	};

	const protocol = urlObject.protocol.slice(0, -1);
	if (protocol === 'file') {
		const fs = await import('fs/promises');
	} else if (protocol.match(/^https?$/)) {
		/** @type {import('https')} */
		const https = await import(protocol);

		return requesting(https, url, requestOptions, dataToSend);
	}
}

/**
 * @typedef LogsomeServerOptions
 * @property {Boolean} [useBeacon=false] use navigator.sendBeacon interface
 * @property {String} [styles] formatting styles
 */

/**
 * @typedef LogsomeServer
 * @property {string} url server's url
 * @property {any} [data] data to send with each log message
 * @property {LogsomeServerOptions & RequestOptions} [options] server options
 */
/**
 * @type {Object<string,LogsomeServer>}
 */
const servers = {};

/**
 * 
 * @param {String} serverNameOrUrl server name or url of endpoint
 * @returns {(...args: any[]) => any[]}
 */
function sender (serverNameOrUrl) {

	const serverConfig = servers[serverNameOrUrl];

	if (serverNameOrUrl === 'void:' || serverConfig.url === 'void:') {
		return function (strings, ...args) {
			const forLog = formatter({style: styles[runtime]}, strings, ...args);
			Object.defineProperty(forLog, 'sending', {value: Promise.resolve, enumerable: false, writable: false});
			return forLog;
		}
	}

	const url = serverConfig.url;
	const urlObject = new URL (url);

	let sending;
	if (runtime === 'browser') {
		sending = sendingFromBrowser.bind (null, serverNameOrUrl);
	} else if (runtime === 'node') {
		sending = sendingFromNode.bind (null, serverNameOrUrl);
	}

	return function (strings, ...args) {
		const forLog = formatter({style: styles[runtime]}, strings, ...args);
		const serverRuntime = (serverConfig.options || {}).styles || 'server';
		const forServer = formatter({style: styles[serverRuntime], wantsObject: true}, strings, ...args);
		const {_, ...tailRest} = forServer.tail;
		const promise = sending(forServer.template, forServer.fills, {...tailRest, ..._});
		Object.defineProperty(forLog, 'sending', {value: promise, enumerable: false, writable: false});	
	
		return forLog;
	}
}

/**
 * Register or get log server by name
 * @param {String} url endpoint locator: regular URL or locator like loggly:<customerToken>
 * @param {Object} [config={}] config
 * @param {String} [config.name] endpoint name
 * @param {String} [config.data] additional data for each message
 * @param {Object} [config.options] options for server
 */
export function endpoint (url, {name, data, options} = {}) {
	
	// already have registered endpoint
	if (url in servers && !name) {
		return sender(url);
	}

	// void: protocol
	if (url === 'void:') {
		if (name) {
			servers[name] = {url};
		}
		return sender(url);
	}

	const parsedUrl = new URL(url);
	const protocolName = parsedUrl.protocol.slice(0, -1);
	// http and https are default protocols
	// if (protocolName !== 'http' && protocolName !== 'https')
	
	/** @type {LogsomeServer} */
	let serverConf;
	if (protocolName in locators) {
		serverConf = locators[protocolName](url);
	} else {
		throw new Error(`Cannot find locator for url: ${url}`);
	}

	servers[url]  = serverConf;
	if (name || name === '') // allows empty name
		servers[name] = serverConf;
	return sender(url);
}

/**
 * Format message for log and send it via default endpoint.
 * Default endpoint have `.name` = '' or if there is no other enpoints configured.
 * Throws error with `.code` = `NO_DEFAULT_ENDPOINT`
 * @param {String[]|TemplateStringsArray} strings template strings
 * @param  {...any} args template args
 * @returns {any[]}
 */
export function report (strings, ...args) {
	const serverKeys = Object.keys(servers);
	let senderFn;
	if (serverKeys.length === 1) {
		senderFn = endpoint(serverKeys[0]);
	} else if (servers['']) {
		senderFn = endpoint('');
	} else {
		const err = new Error ("Default endpoint not configured");
		// @ts-ignore
		err.code = 'NO_DEFAULT_ENDPOINT'
		throw err;
	}
	return senderFn(strings, ...args);
}

export default {
    formatter,
	styles,
	endpoint,
};