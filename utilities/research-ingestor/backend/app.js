import { getTranscript } from "./transcript/youtube.js";

const result = await getTranscript(
    "https://youtu.be/DasbJL9ZDvw"
);

console.log(JSON.stringify(result, null, 2));