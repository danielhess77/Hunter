class StructureEvaluator {

    evaluate(structure) {

        return {

            bias: "Neutral",

            floor: structure.strongestNodeBelowSpot,

            ceiling: structure.strongestNodeAboveSpot,

            tradeZone: false,

            confidence: 0

        };

    }

}

export default StructureEvaluator;