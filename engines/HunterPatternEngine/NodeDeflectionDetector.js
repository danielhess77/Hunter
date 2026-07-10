/**
 * Node Deflection Detector
 *
 * Detects whether price is interacting with
 * a major institutional node.
 */

class NodeDeflectionDetector {

    analyze(currentSnapshot, previousSnapshot) {

        if (!previousSnapshot) {

            return {

                confirmed: false,

                stage: "WAITING_FOR_HISTORY",

                confidence: 0,

                direction: null,

                strike: currentSnapshot.primaryNode?.strike,

                nodeRole: currentSnapshot.primaryNode?.role,

                distanceFromSpot:
                    currentSnapshot.primaryNode?.distanceFromSpot,

                reason: "No previous snapshot."

            };

        }

        const node = currentSnapshot.primaryNode;

        if (!node) {

            return {

                confirmed: false,

                stage: "NO_NODE",

                confidence: 0,

                direction: null,

                strike: null,

                nodeRole: null,

                distanceFromSpot: null,

                reason: "No institutional node."

            };

        }

        const distanceNow =
            Math.abs(currentSnapshot.spot - node.strike);

        const distancePrevious =
            Math.abs(previousSnapshot.spot - node.strike);

        const movingToward =
            distanceNow < distancePrevious;

        const movingAway =
            distanceNow > distancePrevious;

        if (distanceNow > 2) {

            return {

                confirmed: false,

                stage: "OUT_OF_RANGE",

                confidence: 0,

                direction: null,

                strike: node.strike,

                nodeRole: node.role,

                distanceFromSpot: distanceNow,

                reason: "Price is too far from the node."

            };

        }
        let stage = "CONTACT";
        let confidence = 10;
        let reason =
            "Price is interacting with an institutional node.";
        let direction = "PIVOT_WATCH";

        if (currentSnapshot.spot > node.strike) {

            direction = "BEARISH_DEFLECTION_WATCH";

        } else if (currentSnapshot.spot < node.strike) {

            direction = "BULLISH_DEFLECTION_WATCH";

        }

        if (movingToward) {

            stage = "APPROACH";

            confidence = 30;

            reason =
            "Price is moving toward institutional liquidity.";

}

        if (movingAway) {

            stage = "REJECTION";

            confidence = 40;

            reason =
            "Price is moving away from institutional liquidity.";

}

        return {

            confirmed: false,

            stage,

            confidence,

            reason,

            strike: node.strike,

            nodeRole: node.role,

            distanceFromSpot: distanceNow,

            reason
                

        };

    }

}

export default NodeDeflectionDetector;