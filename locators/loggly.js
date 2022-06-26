/** @typedef {import('../logsome.js').LogsomeServer} LogsomeServer */
/**
 * Loggly url to endpoint conversion routine
 * @param {String} url url to parse
 * @returns {LogsomeServer}
 */
export default function loggly(url) {

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