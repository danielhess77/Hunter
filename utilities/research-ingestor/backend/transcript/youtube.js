import { getSubtitles } from "youtube-caption-extractor";

/**
 * Hunter Research Lab
 * Module 1.0
 *
 * Retrieves a transcript from a YouTube URL.
 */

function extractVideoId(url) {
    try {
        const parsed = new URL(url);

        // youtu.be/VIDEO_ID
        if (parsed.hostname.includes("youtu.be")) {
            return parsed.pathname.replace("/", "");
        }

        // youtube.com/watch?v=VIDEO_ID
        const videoId = parsed.searchParams.get("v");
        if (videoId) {
            return videoId;
        }

        // youtube.com/shorts/VIDEO_ID
        const parts = parsed.pathname.split("/");
        const shortsIndex = parts.indexOf("shorts");

        if (shortsIndex >= 0 && parts[shortsIndex + 1]) {
            return parts[shortsIndex + 1];
        }

        return null;

    } catch {
        return null;
    }
}

export async function getTranscript(url) {

    const videoId = extractVideoId(url);

    if (!videoId) {
        return {
            success: false,
            provider: "youtube",
            error: "Invalid YouTube URL."
        };
    }

    try {

        const captions = await getSubtitles({
            videoID: videoId,
            lang: "en"
        });

        return {

            success: true,

            provider: "youtube",

            videoId,

            transcript: captions

        };

    } catch (error) {

        return {

            success: false,

            provider: "youtube",

            videoId,

            error: error.message

        };

    }

}