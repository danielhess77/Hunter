import { build } from "esbuild";

await build({

    entryPoints: [
        "./runtime/HunterRuntime.js"
    ],

    bundle: true,

    format: "iife",

    platform: "browser",

    outfile: "./dist/HunterRuntime.bundle.js",

    sourcemap: false,

    minify: false

});

console.log("");
console.log("==========================");
console.log("Hunter Runtime Built");
console.log("==========================");
console.log("");
console.log("Output:");
console.log("dist/HunterRuntime.bundle.js");
console.log("");