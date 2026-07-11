import BasePatternDetector
    from "./BasePatternDetector.js";

class RugDetector extends BasePatternDetector {

    constructor() {

        super("Rug");

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

const nearCeiling =
    node?.isCeiling === true;

const movingLower =
    currentSnapshot.spot <
    previousSnapshot.spot;

let stage = "WATCHING";
let detected = false;

if (nearCeiling) {

    stage = "SETUP";

}

if (nearCeiling && movingLower) {

    stage = "FORMING";

}

if (

    nearCeiling &&
    movingLower &&
    currentSnapshot.primaryNode.distanceFromSpot < 0.5

) {

    stage = "CONFIRMED";
    detected = true;

}

    return this.createResult({

    detected,

    stage,

    confidence:
        this.calculateConfidence(stage),

    strike:
        node.strike,

    nodeRole:
        node.role,

    distanceFromSpot:
        node.distanceFromSpot,

    reason:
        `Rug ${stage.toLowerCase()}.`

    });

        return this.createResult({

            stage: "WATCHING",

            confidence:
                this.calculateConfidence("WATCHING"),

            strike:
                currentSnapshot.primaryNode.strike,

            nodeRole:
                currentSnapshot.primaryNode.role,

            distanceFromSpot:
                currentSnapshot.primaryNode.distanceFromSpot,

            reason:
                "Watching for Rug formation."

        });

    }

}

export default RugDetector;