/**
 * Structure State Analyzer
 * Version: 1.1
 *
 * Determines institutional node state.
 */

class StructureStateAnalyzer {

    analyze(currentNodes = [], previousNodes = []) {

        const previousMap = new Map(
            previousNodes.map(node => [node.strike, node])
        );

        return currentNodes.map(node => {

            const previous = previousMap.get(node.strike);

            return {

                ...node,

                previousMagnitude: previous?.magnitude ?? null,

                state: "Unknown",

                percentChange: null

            };

        });

    }

}

export default StructureStateAnalyzer;