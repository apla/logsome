import logsome, {endpoint, format, locators, report} from '../logsome.js';

import assert from 'assert';

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

    // @ts-ignore
    it.skip ("with named server", () => {
        logsome.endpoint('http://localhost/api/v1/log', {name: 'local'});
        const sendr = logsome.endpoint('local');
        sendr`${"ok"}`;
        return true;
    });

    it ("supports named void: protocol", () => {

        const array = [1,2,3];
        const str   = "aaa";
        const obj   = {a: 1, b: 2, c: 3};

        const sender = endpoint('void:', {name: 'void'});
        const senderArgs = sender`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`;

        const formatArgs = format`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`;

        assert(Array.isArray(senderArgs));

        // @ts-ignore
        assert(senderArgs.sending);

        assert.strictEqual(senderArgs.length, formatArgs.length);
        assert.strictEqual(senderArgs[0], formatArgs[0]);

        return true;
    });

    it("should throw when no locator for url", () => {
        assert.throws(() => {
            logsome.endpoint(`protocol://`);
        });
    });

    logglyMethod ("with loggly", async () => {
        // This should be done once
        const logglyLocator = await import('../locators/loggly.js');
        locators.loggly = logglyLocator.default;

        // 
        logsome.endpoint(`loggly:${logglyToken}`, {name: 'loggly'});
        const sendr = logsome.endpoint('loggly');
        const str = "aaa";
        const obj = {a: 1, b: 2, c: 3};
        const array  = [1, 2, 3];

        // @ts-ignore
        return await sendr`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}, ${{_: {loglevel: 'log'}}}`.sending;
    });


});