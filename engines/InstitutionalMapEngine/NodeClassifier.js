/**
 * Node Classifier
 * Version 1.3
 *
 * Determines the institutional role of a node.
 */

class NodeClassifier {

    classify(node, context = {}) {

        const magnitude = Math.abs(node.magnitude || node.net || node.value || 0);

        const largestMagnitude = context.largestMagnitude || 0;

        const isKingNode = magnitude > 0 && magnitude === largestMagnitude;

        // Temporary placeholder.
        // We'll replace this with the actual Hunter floor logic
        // once the Data Connector normalizes Skylit fields.
        const isFloor = node.type === "floor" || node.isFloor === true;

        return {

            type: isKingNode
                ? "King Node"
                : isFloor
                    ? "Floor"
                    : "Unknown",

            magnitude,

            isKingNode,

            isFloor

        };

    }

}

export default NodeClassifier;