/**
 * Node Classifier
 * Version 1.5
 *
 * Determines the institutional role of a node.
 */

class NodeClassifier {

    classify(node, context = {}) {

        const magnitude = Math.abs(node.magnitude || node.net || node.value || 0);

        const largestMagnitude = context.largestMagnitude || 0;

        const isKingNode = magnitude > 0 && magnitude === largestMagnitude;

        // Temporary placeholders until the Data Connector
        // normalizes Skylit fields.

        const isFloor =
            node.type === "floor" ||
            node.isFloor === true;

        const isCeiling =
            node.type === "ceiling" ||
            node.isCeiling === true;

        const isGatekeeper =
            node.type === "gatekeeper" ||
            node.isGatekeeper === true;

        let type = "Unknown";

        if (isKingNode)
            type = "King Node";
        else if (isFloor)
            type = "Floor";
        else if (isCeiling)
            type = "Ceiling";
        else if (isGatekeeper)
            type = "Gatekeeper";

        return {

            type,

            magnitude,

            isKingNode,

            isFloor,

            isCeiling,

            isGatekeeper

        };

    }

}

export default NodeClassifier;