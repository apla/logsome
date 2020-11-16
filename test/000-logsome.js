import {format} from '..';

class Capsule {

}

describe ("logsome", () => {
    it ("is awesome", () => {
        return true;
    });
    it ("works with objects", () => {
        const c = new Capsule;
        console.log (...format(c));
    });

    it ("logs objects to console", () => {
        const c = new Capsule;
        console.log (...format`${c}`);
    });


});