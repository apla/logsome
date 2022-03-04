/**
 * @typedef {Object} FormatStyles
 * styles
 * @property {String} common common style for every type
 * @property {String} object style for objects
 * @property {String} array  style for arrays
 * @property {String} fn     style for functions
 * @property {String} clear  style clear
 * @property {Number} maxArrayLength max array element count to inline
 * @property {Number} maxStringLength max string length to inline
 * @property {Boolean} stringify stringify objects using toJSON method
 * @property {String} objectSeparator separator between log string and objects dump
 * @property {Boolean} supportsPercent log environment supports percent notation such as %s %o
 * @property {String} styledTemplate style template
 * @property {Boolean} collectArgs collect args into single structure
 */

/**
 * Stringify single argument
 * @param {FormatStyles} style formatting styles
 * @param {*} arg template string arg
 * @param {Number} index arg index
 * @param {any[]} fills array of fills
 * @param {Array|Object} tail complex objects to dump
 * @returns 
 */
function argDumper (style, arg, index, fills, tail) {
	if (!arg) {
		if (style.supportsPercent) {
			fills.push (arg);
			return '%o';
		}
		return arg; // 0, false, undefined, null, NaN
	}

	if (typeof arg === 'function') {
		console.trace ("You're logging a function. Why?");
		const fnName = (arg.name || 'anonymous');
		Array.isArray(tail) ? tail.push (arg) : tail[fnName + '#' + index] = arg;
		
		const formatArgs = [
			[style.fn, style.common].join (''),
			fnName,
			style.clear
		];
		if (style.supportsPercent) fills.push (...formatArgs);

		return style.styledTemplate || formatArgs.join('');
	} else if (Array.isArray(arg)) {
		if (arg.length > style.maxArrayLength) {
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
		let tailValue = (style.stringify && arg.toJSON) ? arg.toJSON() : arg;

		const customFormat = arg[Symbol.for('logsome')] && arg[Symbol.for('logsome')]();
		const argConstructorName = arg.constructor.name;
		const argKeys = Object.keys(arg);

		// TODO: maybe some heuristics to avoid false positives
		if (style.collectArgs && !customFormat && argConstructorName === 'Object' && argKeys.length === 1) {
			const tailKey = argKeys[0];
			tailValue = arg[tailKey];
			tail[tailKey] = tailValue;
			// avoid recursion with collectArgs
			return argDumper ({...style, collectArgs: false}, tailValue, index, fills, {});
			
		} else {
			if (Array.isArray(tail)) {
				tail.push(arg);
			} else {
				tail[argConstructorName + '#' + index] = arg;
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
		if (style.maxStringLength && arg.length > style.maxStringLength) {
			Array.isArray(tail) ? tail.push (arg) : tail['String#' + index] = arg;
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
 * @param {FormatStyles} binding.style binding object
 * @param {Boolean} [binding.wantsObject] return object instead of array
 * @param {String[]} strings string chunks between interpolations
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

	chunks.push(style.objectSeparator);

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

const roundedStyle = 'border-radius: 2px;';

/**
 * @type {Object<String,FormatStyles>}
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

export const runtime = globalThis.window ? 'browser' : 'node';

export const format = formatter.bind (null, {style: styles[runtime]});

export const locators = {
	
	/**
	 * Loggly url to endpoint conversion routine
	 * @param {String} url url to parse
	 * @returns {LogsomeServer}
	 */
	loggly(url) {

		// expects url like loggly:aaaabbbb-cccc-dddd-eeee-ffffgggghhhh
		const parsedUrl = new URL(url);

		// https://www.loggly.com/blog/node-js-libraries-make-sophisticated-logging-simpler/
		// https://documentation.solarwinds.com/en/success_center/loggly/content/admin/http-endpoint.htm
		const customerToken = parsedUrl.pathname;

		// TODO: loggly supports tags like /^[\w\d][\w\d-_.]+/
		// tags can be sent as a part of URL after /tag/
		// or using X-LOGGLY-TAG header. tag separator is comma

		const endpointType = 'inputs'; // also 'bulk'

		const endpointUrl = `https://logs-01.loggly.com/${endpointType}/${customerToken}/tag/http/`;
		return {
			url: endpointUrl,
			data: {
				// TODO: add IP and more meta
				// clientHost is automatically populated by loggly
				// hostname: typeof process !== 'undefined' ? require('os').hostname() : undefined,
				pid: typeof process !== 'undefined' ? process.pid : undefined,
				
			},
			options: {
				styles: 'server',
				headers: {
					contentType: 'application/json'
				},
				method: 'POST'
			}
		}
	}
};


/**
 * Send log messages
 * @param {Object} message text version of message to send
 * @returns {Promise}
 */
function sendingFromBrowser (serverName, message, fills, values) {

	const serverConfig = servers[serverName];

	const url = serverConfig.url;
	const serverOptions = serverConfig.options;
	const useBeacon = serverOptions.useBeacon;

	// TODO: use formatter
	const dataSerialized = JSON.stringify ({values, message});
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

function sendingFromNode (serverName, message, fills, values) {

	const serverConfig = servers[serverName];

	const url = serverConfig.url;
	const urlObject = new URL (url);

	const serverOptions = serverConfig.options || {};

	const contentType = (serverOptions.headers || {}).contentType || 'text/plain'; // 'multipart/mixed';  // 'application/x-www-form-urlencoded'; // 'application/json';

	// TODO: serialize using formatter
	const dataToSend = JSON.stringify({values, message});

	/** @type {import ('https').RequestOptions} */
	// const requestOptions = {};
	const requestOptions = {
		method:  serverOptions.method || 'POST',
		headers: {'Content-Type': contentType},
	};

	console.log(url);
	console.log(requestOptions);
	console.log(dataToSend);

	// TODO: check for http/https

	return import (urlObject.protocol.slice(0, -1)).then (https => {
		return new Promise((resolve, reject) => {

			let err;

			const req = https.request (url, requestOptions, (res) => {
			
				let body = Buffer.alloc (0);
				
	
				res.on ('data', chunk => body = Buffer.concat ([body, chunk]));
				res.on ('error', _err => (err = _err));
				res.on ('end', () => {
					console.error('---------', body.toString(), '---------');
					if (err) {
						console.error(body.toString(), err);
						reject (err);
					} else if (res.statusCode === 200) {
						resolve ({statusCode: res.statusCode, headers: res.headers, body: body});
					} else {
						reject ('Request failed. status: ' + res.statusCode + ', body: ' + body);
					}
				});
			});
			req.on('error', err => {
				// console.error(err);
				reject(err);
			});
			req.write(dataToSend);
			req.end();
	
		});
	});

}

/** @typedef {import ('https').RequestOptions} RequestOptions */
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
 * @returns {Function}
 */
function sender (serverNameOrUrl) {

	const serverConfig = servers[serverNameOrUrl];

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
		if (urlObject.protocol !== 'void:') {
			const serverRuntime = (serverConfig.options || {}).styles || 'server';
			const forServer = formatter({style: styles[serverRuntime], wantsObject: true}, strings, ...args);
			const promise   = sending(forServer.template, ...forServer.fills, forServer.tail);
			Object.defineProperty(forLog, 'sending', {value: promise, enumerable: false, writable: false});	
		} else {
			Object.defineProperty(forLog, 'sending', {value: Promise.resolve(), enumerable: false, writable: false});	
		}
	
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
	
	if (url in servers && !name) {
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
		serverConf = {
			url,
			data,
			options
		};
	}

	servers[url]  = serverConf;
	if (name)
		servers[name] = serverConf;
	return sender(url);
}

export default {
    formatter,
	styles,
	endpoint,
};