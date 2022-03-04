import {format, styles, formatter, runtime} from '../logsome.js';

const formatToObject = formatter.bind (null, {style: {
    ...styles[runtime],
    collectArgs: true
}});

import assert from 'assert';

class Capsule {

}

const debug = !!process.env.DEBUG;

describe ("logsome", () => {
    it ("is awesome", () => {
        return true;
    });
    it ("supports direct call => array", () => {
        const c = new Capsule;

        const args = format(c);

        assert.strictEqual(args.length, 5);

        // template string
        assert.strictEqual (args[0], styles.node.styledTemplate + styles.node.objectSeparator);
        // ascii colors, skipped
        // class name
        assert.strictEqual (args[2], c.constructor.name);
        // ascii colors clear, skipped
        // class name + arg number
        assert.strictEqual(args[4], c);

        if (debug) console.log (...format(c));
    });

    it ("but it's better to have tagged template string => array", () => {
        const c = new Capsule;
        const args = format`${c}`;

        assert.strictEqual(args.length, 5);

        // template string
        assert.strictEqual(args[0], styles.node.styledTemplate + styles.node.objectSeparator);
        // ascii colors, skipped
        // class name
        assert.strictEqual(args[2], c.constructor.name);
        // ascii colors clear, skipped
        // class name + arg number
        assert.strictEqual(args[4], c);

        if (debug) console.log (...format`${c}`);
    });

    it ("but it's better to have tagged template string => object", () => {
        const c = new Capsule;
        const args = formatToObject`${c}`;

        assert.strictEqual(args.length, 5);

        // template string
        assert.strictEqual(args[0], styles.node.styledTemplate + styles.node.objectSeparator);
        // ascii colors, skipped
        // class name
        assert.strictEqual(args[2], c.constructor.name);
        // ascii colors clear, skipped
        // class name + arg number
        assert.strictEqual(Object.keys(args[4])[0], c.constructor.name + '#0');
        assert.strictEqual(args[4][Object.keys(args[4])[0]], c);

        if (debug) console.log (...formatToObject`${c}`);
    });


    it ("more data to log", () => {
        const c = new Capsule;
        const array = [1, 2, 3];
        const arrayOverMax = [1, 2, 3, 4, 5, 6, 7];
        const str   = "aaa";
        const strOverMax   = "1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij";
        const obj   = {a: 1, b: 2, c: 3};

        const args = formatToObject`${c} class instance, array ${array}, large array ${arrayOverMax}, string ${str}, large string ${strOverMax} number ${42}, object ${obj}`;

        assert.strictEqual(args[2], c.constructor.name);
        assert.strictEqual(args[5], `[${array.toString()}]`);
        assert.strictEqual(args[8], `[${[...arrayOverMax.slice(0, styles.node.maxArrayLength), '...']}]`);
        assert.strictEqual(args[10], 42);
        assert.strictEqual(args[12], obj.constructor.name);

        const collectedObject = args[14];
        assert.deepStrictEqual(collectedObject['Array#2'], arrayOverMax);
        assert.deepStrictEqual(collectedObject['Object#6'], obj);

        if (debug) console.log (...args);
    });

    it ("function logging", () => {
        const f = function () {};

        const args = format`${f}`;

        assert.strictEqual(args.length, 5);

        // template string
        // ascii colors, skipped
        // function name
        assert.strictEqual (args[2], f.name);
        // ascii colors clear, skipped
        // class name + arg number
        assert.strictEqual(args[4], f);

        if (debug) console.log (...args);
    });

    it ("falsy logging", () => {
        const args = format`${undefined} ${null} ${false} ${0}`;

        assert.strictEqual(args.length, 5);

        // template string
        // values
        assert.strictEqual (args[1], undefined);
        assert.strictEqual (args[2], null);
        assert.strictEqual (args[3], false);
        assert.strictEqual (args[4], 0);

        if (debug) console.log (...args);
    });

    it ("log keys => object", () => {
        const array = [1,2,3];
        const str   = "aaa";
        const obj   = {a: 1, b: 2, c: 3};

        const args = formatToObject`array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`;

        assert.strictEqual(args[2], `[${array.toString()}]`);
        assert.strictEqual(args[4], 42);
        assert.strictEqual(args[6], obj.constructor.name);

        const collectedObject = args[8];
        assert.deepStrictEqual(collectedObject.array, array);
        assert.deepStrictEqual(collectedObject.obj, obj);
        assert.deepStrictEqual(collectedObject.str, str);

        if (debug) console.log(...args);
    });


    it ("this is special", () => {

        let args = [];

        class Runner {
            test () {
                args = formatToObject`${this} test method`;
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
                args = formatToObject`${this} test method`;
            }
        }

        const r = new Runner(42);

        r.test();

        assert.strictEqual(args[2], r.constructor.name + '@id=' + 42);
        assert.strictEqual(Object.keys(args[4])[0], r.constructor.name + '#0');

        if (debug) console.log(...args);
    });

});