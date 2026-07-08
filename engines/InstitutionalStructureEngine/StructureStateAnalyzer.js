/**
 * Structure State Analyzer
 * Version: 1.0
 *
 * Calculates node distance from spot.
 */

class StructureStateAnalyzer {

    analyze(nodes, spot) {

        return nodes.map(node => ({

            ...node,

            distance: node.strike - spot,

            absDistance: Math.abs(node.strike - spot),

            aboveSpot: node.strike > spot,

            belowSpot: node.strike < spot

        }));

    }

}

export default StructureStateAnalyzer;