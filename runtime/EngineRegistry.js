/**
 * Engine Registry
 * Version: 1.0
 *
 * Keeps track of all Hunter engines.
 */

class EngineRegistry {

    constructor() {
        this.engines = [];
    }

    register(engine) {
        this.engines.push(engine);
    }

    getAll() {
        return this.engines;
    }

}

export default EngineRegistry;