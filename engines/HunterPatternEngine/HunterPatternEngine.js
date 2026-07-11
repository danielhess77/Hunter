/**
 * Hunter Pattern Engine
 * Version: 0.9.2
 *
 * Hunter Constitution:
 * Rule #1:
 * Hunter only evaluates patterns when price is
 * within two strikes of a major institutional node.
 *
 * Dynamic pattern confirmation is handled by the
 * individual pattern detectors.
 */

import BeachBallDetector from "./BeachBallDetector.js";

import NodeDeflectionDetector
    from "./NodeDeflectionDetector.js";

import ReverseRugDetector
    from "./ReverseRugDetector.js";

import RugDetector
    from "./RugDetector.js";

import RainbowRoadDetector
    from "./RainbowRoadDetector.js";

import WhipsawDetector
    from "./WhipsawDetector.js";

import PikaCloudDetector
    from "./PikaCloudDetector.js";

class HunterPatternEngine {

    constructor() {

        this.detectors = [

        new NodeDeflectionDetector(),

        new ReverseRugDetector(),

        new RugDetector(),

        new BeachBallDetector(),

        new RainbowRoadDetector(),

        new WhipsawDetector(),

        new PikaCloudDetector()

];


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

        const spot =
            marketState?.spot ?? null;

        const majorNodes =
            this.getMajorNodes(structure);

        const nearbyMajorNodes =
            majorNodes
                .map(node => ({

                    ...node,

                    distanceFromSpot:
                        spot !== null
                            ? Math.abs(
                                node.strike - spot
                            )
                            : null

                }))
                .filter(node =>
                    node.distanceFromSpot !== null &&
                    node.distanceFromSpot <= 2
                )
                .sort(
                    (a, b) =>
                        a.distanceFromSpot -
                        b.distanceFromSpot
                );

        const primaryNode =
            nearbyMajorNodes[0] || null;

        const locationEligible =
            primaryNode !== null;

        const requiredData = [];

        //--------------------------------------------------
        // Constitution Rule #1
        //--------------------------------------------------

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

        //--------------------------------------------------
        // Pattern snapshots
        //--------------------------------------------------

        const currentSnapshot = {

            spot,

            primaryNode

        };

        const previousSnapshot =
            marketState?.previousSnapshot ??
            null;

        //--------------------------------------------------
        // Evaluate Pattern Detectors
        //--------------------------------------------------

        const patternResults =
        this.detectors.map(detector =>
        detector.analyze(
            currentSnapshot,
            previousSnapshot
        )
    );

        //--------------------------------------------------
        // Candidate Patterns
        //--------------------------------------------------

        const candidatePatterns =
            patternResults
                .filter(result =>
                    result &&
                    result.stage !==
                        "WAITING_FOR_HISTORY" &&
                    result.stage !==
                        "NO_LOCATION"
                )
                .map(result => ({

                    name: result.name,

                    stage: result.stage,

                    confidence:
                        result.confidence,

                    direction:
                        result.direction,

                    strike:
                        result.strike ??
                        primaryNode.strike,

                    nodeRole:
                        result.nodeRole ??
                        primaryNode.role,

                    distanceFromSpot:
                        result.distanceFromSpot ??
                        primaryNode.distanceFromSpot,

                    reason:
                        result.reason

                }));

        //--------------------------------------------------
        // Confirmed Patterns
        //--------------------------------------------------

        const detectedPatterns =
            patternResults
                .filter(result =>
                    result?.confirmed === true
                )
                .map(result => ({

                    name: result.name,

                    stage: result.stage,

                    confidence:
                        result.confidence,

                    direction:
                        result.direction,

                    strike:
                        result.strike ??
                        primaryNode.strike,

                    nodeRole:
                        result.nodeRole ??
                        primaryNode.role,

                    distanceFromSpot:
                        result.distanceFromSpot ??
                        primaryNode.distanceFromSpot,

                    reason:
                        result.reason

                }));

        //--------------------------------------------------
        // Required historical data
        //--------------------------------------------------

        requiredData.push(
            "priceHistory",
            "nodeMagnitudeHistory",
            "nodeStrikeHistory"
        );

        //--------------------------------------------------
        // Result
        //--------------------------------------------------

        return {

            version: this.version,

            status:
                detectedPatterns.length > 0
                    ? "PATTERN_ACTIVE"
                    : "ELIGIBLE_WAITING_FOR_PATTERN_DATA",

            locationEligible: true,

            nearMajorNode: true,

            primaryNode,

            nearbyMajorNodes,

            detectedPatterns,

            candidatePatterns,

            reason:
                "Price is within two strikes of a major institutional node. Pattern evaluation is permitted.",

            requiredData

        };

    }

    getMajorNodes(structure) {

        const candidates = [

            {
                role: "King Gamma",
                node:
                    structure?.kingGammaNode
            },

            {
                role: "Strongest Above",
                node:
                    structure
                        ?.strongestNodeAboveSpot
            },

            {
                role: "Strongest Below",
                node:
                    structure
                        ?.strongestNodeBelowSpot
            }

        ];

        const uniqueNodes =
            new Map();

        for (const candidate of candidates) {

            const node =
                candidate.node;

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
             * King Gamma takes precedence when
             * one strike has multiple roles.
             */

            if (
                candidate.role ===
                "King Gamma"
            ) {

                uniqueNodes.set(
                    node.strike,
                    {
                        ...node,
                        role: candidate.role
                    }
                );

            }

        }

        return [
            ...uniqueNodes.values()
        ];

    }

}

export default HunterPatternEngine;