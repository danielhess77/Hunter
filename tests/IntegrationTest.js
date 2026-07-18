import fs from "fs";
import HunterRuntime from "../runtime/HunterRuntime.js";

const runtime = new HunterRuntime();

const rawData = JSON.parse(
    fs.readFileSync(
        "./tests/Fixtures/SkylitExport.json",
        "utf8"
    )
);

console.log("========== HUNTER INTEGRATION TEST ==========");

const captures = Array.isArray(rawData)
    ? rawData
    : [rawData];

captures.forEach((capture, index) => {

    console.log(`\n===== Capture ${index + 1} =====`);

    try {

        const result = runtime.analyze(capture);

        console.log(result);

    } catch (err) {

        console.error(err);

    }

});