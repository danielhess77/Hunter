/**
 * Node Classifier
 * Version 1.4
 *
 * Determines the institutional role of a node.
 */

class NodeClassifier {

    classify(node, context = {}) {

        const magnitude = Math.abs(node.magnitude || node.net || node.value || 0);

        const largestMagnitude = context.largestMagnitude || 0;

        const isKingNode = magnitude > 0 && magnitude === largestMagnitude;

        // Temporary placeholders until Data Connector
        // normalizes Skylit fields.

        const isFloor =
            node.type === "floor" ||
            node.isFloor === true;

        const isCeiling =
            node.type === "ceiling" ||
            node.isCeiling === true;

        let type = "Unknown";

        if (isKingNode)
            type = "King Node";
        else if (isFloor)
            type = "Floor";
        else if (isCeiling)
            type = "Ceiling";

        return {

            type,

            magnitude,

            isKingNode,

            isFloor,

            isCeiling

        };

    }

}

export default NodeClassifier;