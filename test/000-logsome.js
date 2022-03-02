import {format, styles, formatter} from '../logsome.js';

import assert from 'assert';

class Capsule {

}

const debug = !!process.env.DEBUG;

describe ("logsome", () => {
    it ("is awesome", () => {
        return true;
    });
    it ("supports direct call", () => {
        const c = new Capsule;

        const args = format(c);

        // template string
        assert.strictEqual (args[0], styles.node.styledTemplate + styles.node.objectSeparator);
        // ascii colors, skipped
        // class name
        assert.strictEqual (args[2], c.constructor.name);
        // ascii colors clear, skipped
        // class name + arg number
        assert.strictEqual (Object.keys(args[4])[0], c.constructor.name + '#0');

        if (debug) console.log (...format(c));
    });

    it ("but it's better to have tagged template string", () => {
        const c = new Capsule;
        // console.log (...format`${c}`);

        const args = format`${c}`;

        // template string
        assert.strictEqual(args[0], styles.node.styledTemplate + styles.node.objectSeparator);
        // ascii colors, skipped
        // class name
        assert.strictEqual(args[2], c.constructor.name);
        // ascii colors clear, skipped
        // class name + arg number
        assert.strictEqual(Object.keys(args[4])[0], c.constructor.name + '#0');

        if (debug) console.log (...format`${c}`);
    });

    it ("more data to log", () => {
        const c = new Capsule;
        const array = [1,2,3];
        const array2 = [1,2,3,4,5,6];
        const str   = "aaa";
        const obj   = {a: 1, b: 2, c: 3};

        const args = format`${c} class instance, array ${array}, other array ${array2} string ${str}, number ${42}, object ${obj}`;

        assert.strictEqual(args[2], c.constructor.name);
        assert.strictEqual(args[5], `[${array.toString()}]`);
        assert.strictEqual(args[8], `[${[...array2.slice(0, styles.node.maxArrayLength), '...']}]`);
        assert.strictEqual(args[10], str);
        assert.strictEqual(args[11], 42);
        assert.strictEqual(args[13], obj.constructor.name);

        const collectedObject = args[15];
        assert.deepStrictEqual(collectedObject['Array#2'], array2);
        assert.deepStrictEqual(collectedObject['Object#5'], obj);

        if (debug) console.log (...args);
    });

    it ("log keys", () => {
        const array = [1,2,3];
        const str   = "aaa";
        const obj   = {a: 1, b: 2, c: 3};

        const args = format`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`;

        assert.strictEqual(args[2], `[${array.toString()}]`);
        assert.strictEqual(args[4], str);
        assert.strictEqual(args[5], 42);
        assert.strictEqual(args[7], obj.constructor.name);

        const collectedObject = args[9];
        assert.deepStrictEqual(collectedObject.array, array);
        assert.deepStrictEqual(collectedObject.obj, obj);
        assert.deepStrictEqual(collectedObject.str, str);

        if (debug) console.log(...args);
    });

    it ("this is special", () => {

        let args = [];

        class Runner {
            test () {
                args = format`${this} test method`;
            }
        }

        const r = new Runner();

        r.test();

        assert.strictEqual(args[2], r.constructor.name);
        assert.strictEqual(Object.keys(args[4])[0], r.constructor.name + '#0');

        if (debug) console.log(...args);
    });

    it ("this is special with id", () => {

        let args = [];

        class Runner {
            constructor(id) {
                this.id = id;
            }
            [Symbol.for('logsome')]() {
                return {
                    title: this.constructor.name + '@id=' + this.id, writable: false,
                    // style: {node: '', browser: ''}
                }
            }
            test() {
                args = format`${this} test method`;
            }
        }

        const r = new Runner(42);

        r.test();

        assert.strictEqual(args[2], r.constructor.name + '@id=' + 42);
        assert.strictEqual(Object.keys(args[4])[0], r.constructor.name + '#0');

        if (debug) console.log(...args);
    });

});