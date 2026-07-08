/**
 * Institutional Map Engine
 * Version: 1.1
 *
 * Reads institutional node data and classifies it.
 */

import NodeClassifier from "./NodeClassifier.js";
import MatrixParser from "./MatrixParser.js";

class InstitutionalMapEngine {

    constructor() {

        this.name = "Institutional Map Engine";

        this.matrixParser = new MatrixParser();

        this.nodeClassifier = new NodeClassifier();

    }

    analyze(marketState) {

        const nodes = this.matrixParser.parse(marketState);
        
        const largestMagnitude = Math.max(
            ...nodes.map(node =>
                Math.abs(node.magnitude)
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