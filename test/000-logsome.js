import {format} from '../logsome.js';

class Capsule {

}

describe ("logsome", () => {
    it ("is awesome", () => {
        return true;
    });
    it ("supports direct call", () => {
        const c = new Capsule;
        console.log (...format(c));
    });

    it ("but it's better to have tagged template string", () => {
        const c = new Capsule;
        console.log (...format`${c}`);
    });

    it ("more data to log", () => {
        const c = new Capsule;
        const array = [1,2,3];
        const array2 = [1,2,3,4,5,6];
        const str   = "aaa";
        const obj   = {a: 1, b: 2, c: 3};
        console.log (...format`${c} class instance, array ${array}, other array ${array2} string ${str}, number ${42}, object ${obj}`);
    });

    it ("log keys", () => {
        const c = new Capsule;
        const array = [1,2,3];
        const str   = "aaa";
        const obj   = {a: 1, b: 2, c: 3};
        console.log (...format`${c} class instance, array ${{array}}, string ${{str}}, number ${42}, object ${{obj}}`);
    });

});