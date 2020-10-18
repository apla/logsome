
function baseFormatForBrowser (options, strings, ...args) {
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
				fills.push (options.styles.fn, ' ' + (arg.name || 'anonymous') + ' ', '');
				return str + '%c%s%c';
			} else if (Array.isArray(arg)) {
				fills.push (options.styles.array, ` Array(${arg.length}) `, '');
				values.push (arg);
				return str + '%c%s%c';
			} else if (arg === Object(arg)) {
				const haveToString = arg.toString !== ({}).toString;
				const argStringified = arg.toString();
				const label = ` ${haveToString ? argStringified : arg.constructor.name} `;
				fills.push (argStringified.style || options.styles.object, label, '');
				values.push (arg);
				return str + '%c%s%c';
			} else {
				return str + arg; // true, <string>
			}
		} else {
			return str + '%o'; // 0, false, undefined, null, NaN
		}
		
	});

	// TODO: send the data to server

	return [chunks.join (''), ...fills, ...values];
}

const roundedStyle = 'border-radius: 3px;';

const baseOptions = {
    styles: {
        common: roundedStyle,
        object: 'background-color: #fe9; color: #333; ' + roundedStyle,
	    array:  'background-color: #fc9; color: #333; ' + roundedStyle,
        fn:     'background-color: #3f9; color: #333; ' + roundedStyle,
        
    }
};

export const format = baseFormatForBrowser.bind (null, baseOptions);

export default {
    format:  baseFormatForBrowser,
    options: baseOptions,
};