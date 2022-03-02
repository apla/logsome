import logsome, {endpoint, format} from '../logsome.js';

import assert from 'assert';

class Capsule {

}

const logglyToken = process.env.LOGGLY;
// @ts-ignore
const logglyMethod = logglyToken ? it : it.skip;

describe ("logsome endpoint", () => {
    it ("void endpoint", () => {

        const array = [1,2,3];
        const str   = "aaa";
        const obj   = {a: 1, b: 2, c: 3};

        const sender = endpoint('void:');
        const senderArgs = sender`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`;

        const formatArgs = format`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`;

        assert(Array.isArray(senderArgs));

        assert(senderArgs.sending);

        assert.strictEqual(senderArgs.length, formatArgs.length);
        assert.strictEqual(senderArgs[0], formatArgs[0]);

        return true;
    });
    
    it.skip ("is awesome too", () => {
        const sendr = logsome.endpoint('http://localhost/api/v0/log');
        sendr`${"ok"}`;
        return true;
    });

    it.skip ("with named server", () => {
        logsome.endpoint('http://localhost/api/v1/log', {name: 'local'});
        const sendr = logsome.endpoint('local');
        sendr`${"ok"}`;
        return true;
    });

    logglyMethod ("with loggly", async () => {
        logsome.endpoint(`loggly:${logglyToken}`, {name: 'loggly'});
        const sendr = logsome.endpoint('loggly');
        const str = "123";
        const obj = {a: 1, b: 2, c: 3};
        const array  = ['a', 'b'];
        return await sendr`test is ${"ok"}, ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`.sending;

    });


});