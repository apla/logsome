import logsome from '..';

class Capsule {

}

describe ("logsome sender", () => {
    it ("is awesome too", () => {
        const sendr = logsome.server ('https://com.example/api/v0/log');
        sendr`${"ok"}`;
        return true;
    });


});