import HunterRuntime from "../runtime/HunterRuntime.js";

import rawData from "./Fixtures/META.json";

const runtime = new HunterRuntime();

const result = runtime.analyze(rawData);

console.log(result);