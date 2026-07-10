/**
 * Node Deflection Detector
 * Version: 1.1.0
 *
 * Detects whether price is interacting with
 * a major institutional node.
 */

import BasePatternDetector
    from "./BasePatternDetector.js";

class NodeDeflectionDetector
    extends BasePatternDetector {

    constructor() {

        super("Node Deflection");

    }

    analyze(currentSnapshot, previousSnapshot) {

        if (!previousSnapshot) {

            return this.waitingForHistory(
                currentSnapshot
            );

        }

        const node =
            currentSnapshot.primaryNode;

        if (!node) {

            return this.noLocation();

        }

        const distanceNow =
            Math.abs(
                currentSnapshot.spot -
                node.strike
            );

        if (distanceNow > 2) {

            return this.createResult({

                stage: "OUT_OF_RANGE",

                confidence: 0,

                strike: node.strike,

                nodeRole: node.role,

                distanceFromSpot: distanceNow,

                reason:
                    "Price is too far from the node."

            });

        }

        const distancePrevious =
            Math.abs(
                previousSnapshot.spot -
                node.strike
            );

        const movingToward =
            distanceNow < distancePrevious;

        const movingAway =
            distanceNow > distancePrevious;

        let stage = "CONTACT";

        let confidence = 10;

        let direction = "PIVOT_WATCH";

        let reason =
            "Price is interacting with an institutional node.";

        if (currentSnapshot.spot > node.strike) {

            direction =
                "BEARISH_DEFLECTION_WATCH";

        }
        else if (currentSnapshot.spot < node.strike) {

            direction =
                "BULLISH_DEFLECTION_WATCH";

        }

        if (movingToward) {

            stage = "APPROACH";

            confidence = 30;

            reason =
                "Price is moving toward institutional liquidity.";

        }
        else if (movingAway) {

            stage = "REJECTION";

            confidence = 40;

            reason =
                "Price is moving away from institutional liquidity.";

        }

        return this.createResult({

            stage,

            confidence,

            direction,

            strike: node.strike,

            nodeRole: node.role,

            distanceFromSpot: distanceNow,

            reason

        });

    }

}

export default NodeDeflectionDetector;