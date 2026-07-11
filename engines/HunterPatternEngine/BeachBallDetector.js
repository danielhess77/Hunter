import BasePatternDetector from "./BasePatternDetector.js";

class BeachBallDetector extends BasePatternDetector {

    constructor() {

        super("Beach Ball");

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

        const node =
            currentSnapshot.primaryNode;

        let stage = "WATCHING";
        let confidence = 10;
        let detected = false;
        let direction = null;
        let reason =
            "Watching for Beach Ball compression.";

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

export default BeachBallDetector;