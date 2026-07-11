/**
 * Reverse Rug Detector
 * Version: 1.1.0
 *
 * Detects the early formation of a
 * Reverse Rug institutional pattern.
 */

import BasePatternDetector
    from "./BasePatternDetector.js";

class ReverseRugDetector
    extends BasePatternDetector {

    constructor() {

        super("Reverse Rug");

    }

    analyze(currentSnapshot, previousSnapshot) {

        //--------------------------------------------------
        // Validation
        //--------------------------------------------------

        if (!previousSnapshot) {

            return this.waitingForHistory(
                currentSnapshot
            );

        }

        if (!currentSnapshot.primaryNode) {

            return this.noLocation();

        }

        //--------------------------------------------------
        // Current state
        //--------------------------------------------------

        const node =
            currentSnapshot.primaryNode;

        const nearFloor =
            node?.isFloor === true;

        const currentSpot =
            currentSnapshot.spot;

        const previousSpot =
            previousSnapshot.spot;

        let stage = "WATCHING";
        let confidence = 10;
        let confirmed = false;
        let reason =
            "Watching for Reverse Rug formation.";

        //--------------------------------------------------
        // Simple prototype logic
        //--------------------------------------------------

        if (
            nearFloor &&
            currentSpot > previousSpot
        ) {

            stage = "BUILDING";

            confidence = 35;

            reason =
                "Price is lifting from an institutional floor.";

        }

        if (
            nearFloor &&
            currentSpot > node.strike
        ) {

            stage = "CONFIRMED";

            confidence = 70;

            confirmed = true;

            reason =
                "Price has reclaimed institutional support.";

        }

        //--------------------------------------------------
        // Return
        //--------------------------------------------------

        return this.createResult({

            confirmed,

            stage,

            confidence,

            direction: "BULLISH",

            strike: node.strike,

            nodeRole: node.role,

            distanceFromSpot:
                node.distanceFromSpot,

            reason

        });

    }

}

export default ReverseRugDetector;