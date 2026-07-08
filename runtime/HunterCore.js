/**
 * Hunter Core
 * Version: 0.2.0
 *
 * Central runtime for Hunter.
 */

import EventBus from "./EventBus.js";
import EngineRegistry from "./EngineRegistry.js";
import HunterMarketState from "./HunterMarketState.js";
import InstitutionalMapEngine from "../engines/InstitutionalMapEngine/InstitutionalMapEngine.js";
import SkylitAdapter from "../adapters/Skylit/SkylitAdapter.js";

class HunterCore {

    constructor() {

        this.version = "0.2.0";

        this.eventBus = new EventBus();

        this.engineRegistry = new EngineRegistry();

        this.institutionalMapEngine = new InstitutionalMapEngine();

        this.registerEngine(this.institutionalMapEngine);

        this.marketState = new HunterMarketState();

        this.dataConnector = new HunterDataConnector();

        this.skylitAdapter = new SkylitAdapter();

        this.running = false;

        console.log("Hunter Core initialized");

    }

    start() {

        this.running = true;

        this.skylitAdapter.connect();

        console.log("Hunter Core started");

    }

    stop() {

        this.skylitAdapter.disconnect();
        
        this.running = false;

        console.log("Hunter Core stopped");

    }

    registerEngine(engine) {

        this.engineRegistry.register(engine);

        console.log(`Registered: ${engine.name}`);

    }

}

export default HunterCore;