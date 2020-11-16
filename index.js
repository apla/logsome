
function formatter ({style, onDone}, strings, ...args) {
	
	// not a template string
	if (!Array.isArray(strings)) {
		const _f = formatter.bind (undefined, {style});
		return _f`${strings} ${args}`;
	}

	const logObject = {};
	const fills  = [];
	const values = [];
	const chunks = strings.map ((str, idx, arr) => {
		if (arr.length - idx === 1)
			return str;
		
		const arg = args[idx];
		
		if (arg) {
			if (typeof arg === 'function') {
				console.trace ("You're logging a function. Why?");
				values.push (arg);
				
				const formatArgs = [
					[style.fn, style.common].join (''),
					' ' + (arg.name || 'anonymous') + ' ',
					style.clear
				];
				if (style.supportsPercent) fills.push (...formatArgs);

				return str + (style.styledTemplate || formatArgs.join(''));
			} else if (Array.isArray(arg)) {
				values.push (arg);

				const formatArgs = [
					[style.array, style.common].join (''),
					` [${arg.length}] `,
					style.clear
				];
				if (style.supportsPercent) fills.push (...formatArgs);

				return str + (style.styledTemplate || formatArgs.join(''));

			} else if (arg === Object(arg)) {
				values.push (arg);

				const haveToString = arg.toString !== ({}).toString;
				const argStringified = arg.toString();
				const label = ` ${haveToString ? argStringified : arg.constructor.name} `;
				const formatArgs = [
					[argStringified.style || style.object, style.common].join (''),
					label,
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
		
	});

	if (onDone) {
		onDone (chunks.join (''), ...fills, ...values);
	}

	return [chunks.join (''), ...fills, ...values];
}

const roundedStyle = 'border-radius: 3px;';

const baseOptions = {
	browserStyle: {
        common: roundedStyle,
        object: 'background-color: #fe9; color: #333; ',
	    array:  'background-color: #fc9; color: #333; ',
		fn:     'background-color: #3f9; color: #333; ',
		clear:  '',
		supportsPercent: true,
		styledTemplate: '%c%s%c',
	},
	nodeStyle: {
        common: '',
        object: '\x1b[35m',
	    array:  '\x1b[36m',
		fn:     '\x1b[33m',
		clear:  '\x1b[0m',
		supportsPercent: true,
		styledTemplate: '%s%s%s',
	},
	serverStyle: {
        common: '',
        object: '\x1b[35m',
	    array:  '\x1b[36m',
		fn:     '\x1b[33m',
		clear:  '\x1b[0m',
		supportsPercent: false,
	},
};

const runtimeStyle = globalThis.window ? baseOptions.browserStyle : baseOptions.nodeStyle;

export const format = formatter.bind (null, {style: runtimeStyle});

/**
 * @typedef LogsomeServer
 * @property {string} url server's url
 * @property {any} [data] data to send with each log message
 * @property {Object} [options] server options
 * @property {Boolean} [options.useBeacon=false] use navigator.sendBeacon interface
 */

/**
 * @type {Object<string,LogsomeServer>}
 */
const servers = {};

function sender (serverName) {

	const serverConfig = servers[serverName];

	const url = serverConfig.url;
	const useBeacon = serverConfig.options.useBeacon;

	/**
	 * Send log messages
	 * @param {Object} message text version of message to send
	 * @returns {Promise}
	 */
	function send (message, ...values) {
		const contentType = 'text/plain'; // 'multipart/mixed';  // 'application/x-www-form-urlencoded'; // 'application/json';
		if (
			window && window.Blob && window.navigator.sendBeacon
			&& useBeacon
		) {
			return new Promise (resolve => {
				let data;
				// if (contentType === 'application/json') {
				// 	data = new Blob([ JSON.stringify(json) ], { type: contentType });
				// } else if (contentType === 'multipart/mixed') {
				// 	data = new FormData ();
				// 	data.append ('json', JSON.stringify (json));
				// } else {
					data = JSON.stringify ({values, message});
				// }
				resolve (window.navigator.sendBeacon (url, data));
			});
		} else {
			return fetch (url, {
				method: 'POST',
				mode: 'no-cors',
				headers: {'Content-Type': contentType},
				body: JSON.stringify({values, message}),
			});
		}
	}

	return formatter.bind (undefined, {style: baseOptions.serverStyle, onDone: send});
}

/**
 * Register or get log server by name
 * @param {string} name server name
 * @param {string} [url] server api endpoint url
 * @param {Object} [data] data to send with each log message
 * @param {Object} [serverOptions] options for server
 */
function server (name, url, data = {}, serverOptions = {}) {
	
	if (!url) {
		if (name.match (/^\w+:\/\//)) {
			data = url;
			url  = name;
			name = '';
			servers[name] = {url, data, options: serverOptions};
			return sender (name);
		}

		if (data) {
			console.warn ('Unexpected usage: you must provide name, or name+url, or name+url+data');
		}

		return sender (name);
	}
	
	servers[name] = {url, data, options: serverOptions};
	return sender (name);
}

export default {
    formatter,
	options: baseOptions,
	server
};