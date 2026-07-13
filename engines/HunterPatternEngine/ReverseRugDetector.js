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

        //----------------------------------------------------
        // Find the next three strikes above the floor
        //----------------------------------------------------

        const nodes =
            currentSnapshot.nodes || [];

        const currentIndex =
            nodes.findIndex(
                n => n.strike === node.strike
        );

        const nextThreeStrikes =
            currentIndex >= 0

                ? nodes.slice(
                currentIndex + 1,
                currentIndex + 4
        )

        : [];

        //----------------------------------------------------
        // Validate institutional fuel
        //----------------------------------------------------

        const hasFuel =

            nextThreeStrikes.length === 3 &&

            nextThreeStrikes.every(node =>

                node.gammaNet < 0

    );

        const nearFloor =
            node?.isFloor === true;

        const currentSpot =
            currentSnapshot.spot;

        const previousSpot =
            previousSnapshot.spot;

        let detected = false;

        let stage = "WATCHING";

        let direction = "Bullish";

        let confidence = 100;

        let reason =
            "Reverse Rug not detected.";

        if (hasFuel) {

            detected = true;

            stage = "CONFIRMED";

            reason =
                "Valid institutional floor with negative gamma fuel above.";

}

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

            detected,

            stage,

            confidence,

            direction,

            strike: node.strike,

            nodeRole: node.role,

            distanceFromSpot:
                node.distanceFromSpot,

            reason

});

    }

}

export default ReverseRugDetector;