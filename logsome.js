// import http from 'http';
// import https from 'https';


/**
 * @typedef {Object} FormatStyles
 * @property {String} common common style for every type
 * @property {String} object style for objects
 * @property {String} array  style for arrays
 * @property {Number} arrayMax max array element count to inline
 * @property {String} fn     style for functions
 * @property {String} clear  style clear
 * @property {String} objectSeparator separator between log string and objects dump
 * @property {String} supportsPercent log environment supports percent notation
 * @property {String} styledTemplate style template
 */

function argDumper (style, arg, str, fills, values) {
	if (arg) {
		if (typeof arg === 'function') {
			console.trace ("You're logging a function. Why?");
			values.push (arg);
			
			const formatArgs = [
				[style.fn, style.common].join (''),
				(arg.name || 'anonymous'),
				style.clear
			];
			if (style.supportsPercent) fills.push (...formatArgs);

			return str + (style.styledTemplate || formatArgs.join(''));
		} else if (Array.isArray(arg)) {
			if (arg.length > style.arrayMax) {
				values.push (arg);
			}

			const formatArgs = [
				[style.array, style.common].join (''),
				`[${arg.slice(0, style.arrayMax)}${arg.length > style.arrayMax ? ',...' : ''}]`,
				style.clear
			];
			if (style.supportsPercent) fills.push (...formatArgs);

			return str + (style.styledTemplate || formatArgs.join(''));

		} else if (arg === Object(arg)) {
			values.push ((style.stringify && arg.toJSON) ? arg.toJSON() : arg);


			const haveToString = arg.toString !== ({}).toString;
			const argStringified = arg.toString();
			const argConstructorName = arg.constructor.name;

			// TODO: maybe some heuristics to avoid false positives
			if (style.singleKey && !haveToString && argConstructorName === 'Object' && Object.keys(arg).length === 1) {
			}

			const formatArgs = [
				[argStringified.style || style.object, style.common].join (''),
				haveToString ? argStringified : argConstructorName,
				style.clear
			];
			
			if (style.supportsPercent) fills.push (...formatArgs);

			return str + (style.styledTemplate || formatArgs.join(''));
		} else if (arg.constructor instanceof String) {
			return [str, arg, ''].join ('"'); // <string>
		} else {
			if (style.supportsPercent) {
				fills.push (arg);
				return str + '%o';
			}
			return str + arg; // true
		}
	} else {
		if (style.supportsPercent) {
			fills.push (arg);
			return str + '%o';
		}
		return str + arg; // 0, false, undefined, null, NaN
	}
}

// TODO: return object from formatter,
// consume that object by consoleExporter and return list
// for console.* methods
/**
 * Template string args formatter 
 * @param {Object} binding binding object
 * @param {FormatStyles} binding.style binding object
 * @param {Boolean} [binding.wantsObject] return object instead of array
 * @param {String[]} strings string chunks between interpolations
 * @param  {...any} args interpolations
 * @returns {Array|Object}
 */
function formatter ({style, wantsObject}, strings, ...args) {
	
	// not a template string
	// TODO: check/split for %o
	if (!Array.isArray(strings) && strings) {
		return formatter({style, wantsObject}, Array.from({length: args.length + 2}, _ => ''), strings, ...args);
	}

	const logObject = {};
	const fills  = [];
	const values = [];
	const chunks = strings.map ((str, idx, arr) => {
		if (arr.length - idx === 1)
			return str;
		
		const arg = args[idx];
		
		return argDumper (style, arg, str, fills, values);
		
	});

	chunks.push(style.objectSeparator);

	if (wantsObject) {
		return {
			template: chunks.join (''),
			fills,
			values,
		};
	}

	return [chunks.join (''), ...fills, ...values];
}

const roundedStyle = 'border-radius: 3px;';


/**
 * @type {Object<String,FormatStyles>}
 */
const styles = {
	// browser environment
	browser: {
        common: roundedStyle,
        object: 'background-color: #fe9; color: #333; ',
	    array:  'background-color: #fc9; color: #333; ',
		arrayMax: 5,
		fn:     'background-color: #3f9; color: #333; ',
		clear:  '',
		objectSeparator: '',
		supportsPercent: true,
		styledTemplate: '%c %s %c', // quite ugly rounded corners
	},
	// node logs
	node: {
        common: '',
        object: '\x1b[35m',
	    array:  '\x1b[36m',
		arrayMax: 5,
		fn:     '\x1b[33m',
		clear:  '\x1b[0m',
		objectSeparator: ' ||| ',
		supportsPercent: true,
		styledTemplate: '%s%s%s',
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
	},
};

const runtime = globalThis.window ? 'browser' : 'node';

export const format = formatter.bind (null, {style: styles[runtime]});

const locators = {
	
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
				// clientHost:
				pid: typeof process !== 'undefined' ? process.pid : undefined
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

	const contentType = serverOptions.headers?.contentType || 'text/plain'; // 'multipart/mixed';  // 'application/x-www-form-urlencoded'; // 'application/json';
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

	const serverOptions = serverConfig.options;

	const contentType = serverConfig.options?.headers?.contentType || 'text/plain'; // 'multipart/mixed';  // 'application/x-www-form-urlencoded'; // 'application/json';

	// TODO: serialize using formatter
	const dataToSend = JSON.stringify({values, message});

	/** @type {import ('https').RequestOptions} */
	// const requestOptions = {};
	const requestOptions = {
		method:  serverConfig.options?.method || 'POST',
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

	let sending;
	if (runtime === 'browser') {
		sending = sendingFromBrowser.bind (null, serverNameOrUrl);
	} else if (runtime === 'node') {
		sending = sendingFromNode.bind (null, serverNameOrUrl);
	}

	const serverConfig = servers[serverNameOrUrl];

	return function (strings, ...args) {
		const serverRuntime = serverConfig.options?.styles || 'server';
		const forLog    = formatter({style: styles[runtime], wantsObject: true}, strings, ...args);
		const forServer = formatter({style: styles[serverRuntime], wantsObject: true}, strings, ...args);
		const promise   = sending(forServer.template, ...forServer.fills, ...forServer.values);
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