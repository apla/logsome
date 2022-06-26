import {endpoint, format, styles, formatter, runtime, classFormats} from '../logsome.js';

/** @typedef {import('../logsome.js').FormatStyle} FormatStyle */

const formatToObject = formatter.bind (null, {
    /** @type {FormatStyle} */
    style: {
        ...styles[runtime],
        collectArgs: true
    }
});

const formatFn = formatter.bind (null, {
    /** @type {FormatStyle} */
    style: {
        ...styles[runtime],
        ignoreFnFormat: true
    }
});

const formatServer = formatter.bind (null, {
    /** @type {FormatStyle} */
    style: {
        ...styles.server,
        ignoreFnFormat: true
    }
});


// Error presentation
classFormats.installPredefined();

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

        const args = format`${c}`;

        assert.strictEqual(args.length, 5);

        // template string
        assert.strictEqual (args[0], styles.node.styledTemplate + styles.node.objectSeparator);
        // ascii colors, skipped
        // class name
        assert.strictEqual (args[2], c.constructor.name);
        // ascii colors clear, skipped
        // class name + arg number
        assert.strictEqual(args[4], c);

        if (debug) console.log (...format`${c}`);
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

    it ("primitive values in object", () => {

        const obj = {
            type: 23,
            target: "obj",
            toString () {
                return "Widget"
            }
        };

        const zero = 0;
        const one = 1;
        const target = obj.target;

        const data1 = format`${obj} ${target} ${0}/${1}`;

        const data2 = format`${obj} ${obj.target} ${zero}/${one}`;

        const data3 = format`${obj} ${{target}} ${{zero}}/${{one}}`;

        assert.deepStrictEqual(data1, data2);

        assert.deepStrictEqual(data2, data3);

    });



    it ("function logging", () => {
        const f = function () {};

        const args = formatFn`${f}`;

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

    it ("this is special with facade", () => {

        let args = [];

        class Runner {
            constructor(arg1, arg2) {
                this.arg1 = arg1;
                this.arg2 = arg2;
            }
            [Symbol.for('logsome')]() {
                return {
                    facade: () => {
                        
                        // copy everything except arg2
                        const {arg2, ...props} = this;
                        // make sure class name and prototype is copied as well
                        let clone = Object.assign(Object.create(Object.getPrototypeOf(this)), props);

                        return clone;
                    }
                }
            }
            test() {
                args = formatToObject`${this} test method`;
            }
        }

        const r = new Runner('a', 42);

        r.test();

        const tail = args[4];

        const facadeObj = tail[Object.keys(tail)[0]];

        assert.strictEqual(Object.keys(tail)[0], r.constructor.name + '#0');
        assert.strictEqual(Object.keys(facadeObj).length, 1);
        assert.strictEqual(facadeObj.arg1, 'a');

        if (debug) console.log(...args);
    });

    it ("special class handling: Error", () => {

        const err = new TypeError('Not an error');

        const args = formatToObject`Error: ${err}`;

        assert.notStrictEqual(args[1], styles[runtime].object);
        assert.strictEqual(args[2], err.constructor.name);

        if (debug) console.log(...args);
    });

    it("underscore property is a special; client", () => {

        const args = format`underscore and nothing more${{_: {loglevel: 'warn'}}}`;

        assert.strictEqual(args.length, 1);
        assert.strictEqual(args[0], 'underscore and nothing more');

        if (debug) console.log(...args);
    });

    it ("underscore property is a special; server", () => {

        const argsServer = formatServer`underscore and nothing more${{_: {loglevel: 'warn'}}}`;

        assert.strictEqual(argsServer.length, 2);
        assert.strictEqual(argsServer[0], 'underscore and nothing more');
        assert.deepStrictEqual(Object.keys(argsServer[1]), ['_']);
        assert.deepStrictEqual(argsServer[1]['_'], {loglevel: 'warn'});

        if (debug) console.log(...argsServer);
    });

});