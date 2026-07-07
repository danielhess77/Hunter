/**
 * Node Classifier
 * Version 1.2
 *
 * Determines the institutional role of a node.
 */

class NodeClassifier {

    classify(node, context = {}) {

        const magnitude = Math.abs(node.magnitude || node.net || node.value || 0);

        const largestMagnitude = context.largestMagnitude || 0;

        const isKingNode = magnitude > 0 && magnitude === largestMagnitude;

        return {
            type: isKingNode ? "King Node" : "Unknown",
            magnitude,
            isKingNode
        };

    }

}

export default NodeClassifier;