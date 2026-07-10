/**
 * Hunter Base Pattern Detector
 * Version: 1.0.0
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

}

export default BasePatternDetector;