/**
 * Node Classifier
 * Version 1.1
 *
 * Determines the institutional role of a node.
 */

class NodeClassifier {

    classify(node) {

        // Default result

        let result = {
            type: "Unknown",
            magnitude: 0,
            isKingNode: false
        };

        // King Node

        if (node.isKingNode === true) {

            result.type = "King Node";
            result.isKingNode = true;
            result.magnitude = node.magnitude || 0;

        }

        return result;

    }

}

export default NodeClassifier;