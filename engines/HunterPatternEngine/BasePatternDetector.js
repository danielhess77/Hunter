/**
 * Hunter Base Pattern Detector
 * Version: 1.1.0
 *
 * Provides a consistent result contract for
 * Hunter's institutional pattern detectors.
 *
 * Pattern-specific trading logic remains inside
 * each individual detector.
 */

class BasePatternDetector {

    constructor(name) {

        if (!name) {

            throw new Error(
                "Pattern detector requires a name."
            );

        }

        this.name = name;

    }

    //--------------------------------------------------
    // Standard Pattern Result
    //--------------------------------------------------

    createResult({

        detected = false,

        stage = "WATCHING",

        confidence = 0,

        direction = null,

        reason = "",

        strike = null,

        nodeRole = null,

        distanceFromSpot = null

    } = {}) {

        return {

            name: this.name,

            detected,

            confirmed: detected,

            stage,

            confidence,

            direction,

            strike,

            nodeRole,

            distanceFromSpot,

            reason

        };

    }

    //--------------------------------------------------
    // Common Runtime States
    //--------------------------------------------------

    waitingForHistory(currentSnapshot) {

        const node =
            currentSnapshot?.primaryNode ?? null;

        return this.createResult({

            stage: "WAITING_FOR_HISTORY",

            confidence: 0,

            strike:
                node?.strike ?? null,

            nodeRole:
                node?.role ?? null,

            distanceFromSpot:
                node?.distanceFromSpot ?? null,

            reason:
                "No previous snapshot."

        });

    }

    noLocation() {

        return this.createResult({

            stage: "NO_LOCATION",

            confidence: 0,

            reason:
                "No major institutional node."

        });

    }

    //--------------------------------------------------
    // Shared Confidence Calculator
    //--------------------------------------------------

    calculateConfidence(stage) {

        switch (stage) {

            case "WATCHING":
                return 10;

            case "APPROACH":
                return 30;

            case "CONTACT":
                return 50;

            case "REJECTION":
                return 60;

            case "CONFIRMED":
                return 90;

            default:
                return 0;

        }

    }

}

export default BasePatternDetector;