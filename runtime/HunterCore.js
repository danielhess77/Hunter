/**
 * Hunter Core
 * Version: 0.1.0
 *
 * The central runtime for the Hunter AI Engine.
 * Every module plugs into this class.
 */

class HunterCore {

    constructor() {

        this.version = "0.1.0";

        this.state = {};

        this.engines = [];

        this.running = false;

        console.log("Hunter Core initialized");

    }

    start() {

        this.running = true;

        console.log("Hunter Core started");

    }

    stop() {

        this.running = false;

        console.log("Hunter Core stopped");

    }

    registerEngine(engine) {

        this.engines.push(engine);

        console.log(`Engine registered: ${engine.name}`);

    }

}

export default HunterCore;