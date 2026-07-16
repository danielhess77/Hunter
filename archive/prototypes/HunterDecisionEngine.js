/**
 * Hunter Decision Engine
 * Version: 0.6
 *
 * First reasoning engine.
 *
 * Evaluates Institutional Structure only.
 */

class HunterDecisionEngine {

    analyze(structure) {

        let score = 0;

        const reasons = [];

        //--------------------------------------------------
        // Institutional Support
        //--------------------------------------------------

        if (
            structure.strongestNodeBelowSpot &&
            structure.nearestDistance <= 2
        ) {

            score += 30;

            reasons.push(
                "Price is near institutional demand."
            );

        }

        //--------------------------------------------------
        // Institutional Resistance
        //--------------------------------------------------

        if (
            structure.strongestNodeAboveSpot &&
            structure.strongestNodeAboveSpot.strike >
            structure.nearestNode.strike
        ) {

            score += 10;

            reasons.push(
                "Upside liquidity available."
            );

        }

        //--------------------------------------------------
        // King Gamma
        //--------------------------------------------------

        if (
            structure.kingGammaNode &&
            Math.abs(
                structure.kingGammaNode.strike -
                structure.nearestNode.strike
            ) <= 2
        ) {

            score += 20;

            reasons.push(
                "Trading near King Gamma."
            );

        }

        //--------------------------------------------------
        // Nearby Liquidity
        //--------------------------------------------------

        if (
            structure.nearbyNodes.length >= 3
        ) {

            score += 15;

            reasons.push(
                "Multiple institutional nodes nearby."
            );

        }

        //--------------------------------------------------
        // Grade
        //--------------------------------------------------

        let grade = "Pass";

        if (score >= 70)
            grade = "A";

        else if (score >= 50)
            grade = "B";

        else if (score >= 30)
            grade = "Watch";

        return {

            score,

            grade,

            reasons

        };

    }

}

export default HunterDecisionEngine;