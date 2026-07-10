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

        if (!previousSnapshot) {

            return this.waitingForHistory(
                currentSnapshot
            );

        }

        if (!currentSnapshot.primaryNode) {

            return this.noLocation();

        }

        return this.createResult({

            stage: "WATCHING",

            confidence: 10,

            strike:
                currentSnapshot.primaryNode.strike,

            nodeRole:
                currentSnapshot.primaryNode.role,

            distanceFromSpot:
                currentSnapshot.primaryNode.distanceFromSpot,

            reason:
                "Watching for Reverse Rug formation."

        });

    }

}

export default ReverseRugDetector;