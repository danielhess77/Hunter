/**
 * Hunter Node Deflection Detector
 * Version: 0.7.0
 *
 * Detects the first institutional trading pattern:
 * Node Deflection.
 */

class NodeDeflectionDetector {

    analyze(currentSnapshot, previousSnapshot) {

        if (!previousSnapshot) {

            return {
                confirmed: false,
                stage: "WAITING_FOR_HISTORY",
                confidence: 0,
                direction: null,
                reason: "No previous snapshot."
            };

        }

        const node = currentSnapshot?.primaryNode;

        if (!node) {

            return {
                confirmed: false,
                stage: "NO_NODE",
                confidence: 0,
                direction: null,
                reason: "No institutional node."
            };

        }

        if (node.distanceFromSpot > 2) {

            return {
                confirmed: false,
                stage: "NO_CONTACT",
                confidence: 0,
                direction: null,
                reason: "Price is not within two strikes."
            };

        }

        const direction =
            node.strike < currentSnapshot.spot
                ? "BULLISH_DEFLECTION_WATCH"
                : node.strike > currentSnapshot.spot
                    ? "BEARISH_DEFLECTION_WATCH"
                    : "PIVOT_WATCH";

        return {

            confirmed: false,

            stage: "CONTACT",

            confidence: 10,

            direction,

            reason: "Price is interacting with an institutional node."

        };

    }

}

export default NodeDeflectionDetector;