/**
 * Institutional Map Engine
 * Version: 1.1
 *
 * Reads institutional node data and classifies it.
 */

import NodeClassifier from "./NodeClassifier.js";

class InstitutionalMapEngine {

    constructor() {

        this.name = "Institutional Map Engine";

        this.nodeClassifier = new NodeClassifier();

    }

    analyze(nodes = []) {

        const largestMagnitude = Math.max(
            ...nodes.map(node =>
                Math.abs(node.magnitude || node.net || node.value || 0)
            ),
            0
        );

        return nodes.map(node =>
            this.nodeClassifier.classify(node, {
                largestMagnitude
            })
        );

    }

}

export default InstitutionalMapEngine;