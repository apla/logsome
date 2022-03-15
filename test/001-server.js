import logsome, {endpoint, format, report} from '../logsome.js';

import assert from 'assert';

class Capsule {

}

const logglyToken = process.env.LOGGLY;
// @ts-ignore
const logglyMethod = logglyToken ? it : it.skip;

describe ("logsome endpoint", () => {
    it ("supports void: protocol", () => {

        const array = [1,2,3];
        const str   = "aaa";
        const obj   = {a: 1, b: 2, c: 3};

        const sender = endpoint('void:');
        const senderArgs = sender`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`;

        const formatArgs = format`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`;

        assert(Array.isArray(senderArgs));

        // @ts-ignore
        assert(senderArgs.sending);

        assert.strictEqual(senderArgs.length, formatArgs.length);
        assert.strictEqual(senderArgs[0], formatArgs[0]);

        return true;
    });
    
    it ("throws without default endpoint", () => {
        assert.throws(() => {
            report`${null}`
        }, {
            code: 'NO_DEFAULT_ENDPOINT'
        });
    });

    it ("defaults to single endpoint", () => {
        endpoint('http://localhost/api/v0/log');
        report`${null}`;
    });

    it ("defaults to empty string endpoint", () => {
        endpoint('http://localhost/api/v1/log', {name: ''});
        report`${null}`;
    });

    // it ("fails promise when server not reachable", async () => {
    //     const sendr = logsome.endpoint('http://localhost/api/v0/log');
    //     const sending = (sendr`${"ok"}`).sending;
    //     return sending;
    // });

    it.skip ("with named server", () => {
        logsome.endpoint('http://localhost/api/v1/log', {name: 'local'});
        const sendr = logsome.endpoint('local');
        sendr`${"ok"}`;
        return true;
    });

    logglyMethod ("with loggly", async () => {
        logsome.endpoint(`loggly:${logglyToken}`, {name: 'loggly'});
        const sendr = logsome.endpoint('loggly');
        const str = "aaa";
        const obj = {a: 1, b: 2, c: 3};
        const array  = [1, 2, 3];
        return await sendr`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`.sending;
    });


});