import BasePatternDetector
    from "./BasePatternDetector.js";

class WhipsawDetector
    extends BasePatternDetector {

    constructor() {

        super("Whipsaw");

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

        return this.createResult({

            stage: "WATCHING",

            confidence:
                this.calculateConfidence("WATCHING"),

            strike: node.strike,

            nodeRole: node.role,

            distanceFromSpot:
                node.distanceFromSpot,

            reason:
                "Watching for Whipsaw formation."

        });

    }

}

export default WhipsawDetector;