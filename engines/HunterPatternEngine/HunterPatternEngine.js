/**
 * Hunter Pattern Engine
 * Version: 0.6.0
 *
 * Establishes pattern eligibility and the runtime
 * contract for Hunter's institutional patterns.
 *
 * Core rule:
 * Hunter does not evaluate trade patterns at midpoints.
 * Price must be within two strikes of a major node.
 *
 * Dynamic pattern detection will be added after the
 * runtime stores price and institutional-node history.
 */

class HunterPatternEngine {

    constructor() {

        this.version = "0.6.0";

        this.patternNames = [
            "Node Deflection",
            "Rug",
            "Reverse Rug",
            "Beach Ball",
            "Rainbow Road",
            "Whipsaw",
            "Pike Cloud Regime"
        ];

    }

    analyze(marketState, structure) {

        const spot = marketState?.spot ?? null;

        const majorNodes = this.getMajorNodes(structure);

        const nearbyMajorNodes = majorNodes
            .map(node => ({
                ...node,
                distanceFromSpot:
                    spot !== null
                        ? Math.abs(node.strike - spot)
                        : null
            }))
            .filter(node =>
                node.distanceFromSpot !== null &&
                node.distanceFromSpot <= 2
            )
            .sort(
                (a, b) =>
                    a.distanceFromSpot - b.distanceFromSpot
            );

        const primaryNode =
            nearbyMajorNodes[0] || null;

        const locationEligible =
            primaryNode !== null;

        const requiredData = [];

        if (!locationEligible) {

            return {

                version: this.version,

                status: "INELIGIBLE",

                locationEligible: false,

                nearMajorNode: false,

                primaryNode: null,

                nearbyMajorNodes: [],

                detectedPatterns: [],

                candidatePatterns: [],

                reason:
                    "Price is not within two strikes of a major institutional node. Hunter does not trade midpoints.",

                requiredData

            };

        }

        /*
         * A live snapshot confirms institutional location,
         * but it does not prove a dynamic pattern.
         *
         * Rug / Reverse Rug / Beach Ball / Rainbow Road /
         * Whipsaw / Pike Cloud require historical observations.
         */

        requiredData.push(
            "priceHistory",
            "nodeMagnitudeHistory",
            "nodeStrikeHistory"
        );

        return {

            version: this.version,

            status: "ELIGIBLE_WAITING_FOR_PATTERN_DATA",

            locationEligible: true,

            nearMajorNode: true,

            primaryNode,

            nearbyMajorNodes,

            detectedPatterns: [],

            candidatePatterns: [
                {
                    name: "Node Deflection",
                    status: "WATCHING",
                    direction:
                        primaryNode.strike < spot
                            ? "BULLISH_DEFLECTION_WATCH"
                            : primaryNode.strike > spot
                                ? "BEARISH_DEFLECTION_WATCH"
                                : "PIVOT_WATCH",
                    nodeStrike: primaryNode.strike,
                    nodeRole: primaryNode.role,
                    distanceFromSpot:
                        primaryNode.distanceFromSpot,
                    reason:
                        "Price is near a major institutional node. Confirmation requires price response data."
                }
            ],

            reason:
                "Price is within two strikes of a major institutional node. Pattern evaluation is permitted.",

            requiredData

        };

    }

    getMajorNodes(structure) {

        const candidates = [
            {
                role: "King Gamma",
                node: structure?.kingGammaNode
            },
            {
                role: "Strongest Above",
                node: structure?.strongestNodeAboveSpot
            },
            {
                role: "Strongest Below",
                node: structure?.strongestNodeBelowSpot
            }
        ];

        const uniqueNodes = new Map();

        for (const candidate of candidates) {

            const node = candidate.node;

            if (
                !node ||
                typeof node.strike !== "number"
            ) {
                continue;
            }

            const existing =
                uniqueNodes.get(node.strike);

            if (!existing) {

                uniqueNodes.set(
                    node.strike,
                    {
                        ...node,
                        role: candidate.role
                    }
                );

                continue;

            }

            /*
             * King Gamma takes precedence when one strike
             * appears in multiple structural roles.
             */

            if (candidate.role === "King Gamma") {

                uniqueNodes.set(
                    node.strike,
                    {
                        ...node,
                        role: candidate.role
                    }
                );

            }

        }

        return [...uniqueNodes.values()];

    }

}

export default HunterPatternEngine;