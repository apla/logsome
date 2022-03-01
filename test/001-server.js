import logsome from '../logsome.js';

class Capsule {

}

const logglyToken = process.env.LOGGLY;
// @ts-ignore
const logglyMethod = logglyToken ? it : it.skip;

describe ("logsome endpoint", () => {
    it ("void endpoint", () => {
        const sendr = logsome.endpoint('void:');
        sendr`${"ok"}`;
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