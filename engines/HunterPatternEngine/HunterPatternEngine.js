/**
 * Hunter Pattern Engine
 * Version: 2.0.0 (Canonical)
 *
 * Responsibilities:
 * 1. Enforce Constitution Rule #1
 * 2. Build canonical snapshots
 * 3. Execute all pattern detectors
 * 4. Normalize detector output
 */

import BeachBallDetector from "./BeachBallDetector.js";
import NodeDeflectionDetector from "./NodeDeflectionDetector.js";
import ReverseRugDetector from "./ReverseRugDetector.js";
import RugDetector from "./RugDetector.js";
import RainbowRoadDetector from "./RainbowRoadDetector.js";
import WhipsawDetector from "./WhipsawDetector.js";
import PikaCloudDetector from "./PikaCloudDetector.js";

class HunterPatternEngine {

    constructor() {

        this.version = "2.0.0";

        this.detectors = [
            new NodeDeflectionDetector(),
            new ReverseRugDetector(),
            new RugDetector(),
            new BeachBallDetector(),
            new RainbowRoadDetector(),
            new WhipsawDetector(),
            new PikaCloudDetector()
        ];

    }

    analyze(marketState = {}, structure = {}) {

        const spot = marketState.spot ?? null;

        const nearbyMajorNodes = this.collectMajorNodes(structure)
            .filter(node => {
                const distance =
                    node.absoluteDistanceInStrikes ??
                    Math.abs((spot ?? 0) - node.strike);

                return distance <= 2;
            })
            .sort((a, b) => {
                const da =
                    a.absoluteDistanceInStrikes ??
                    Math.abs((spot ?? 0) - a.strike);

                const db =
                    b.absoluteDistanceInStrikes ??
                    Math.abs((spot ?? 0) - b.strike);

                return da - db;
            });

        const primaryNode = nearbyMajorNodes[0] ?? null;

        if (!primaryNode) {

            return {
                version: this.version,
                status: "INELIGIBLE",
                locationEligible: false,
                nearMajorNode: false,
                primaryNode: null,
                nearbyMajorNodes: [],
                detectedPatterns: [],
                candidatePatterns: [],
                requiredData: [],
                reason:
                    "Price is not within two strikes of a major institutional node."
            };

        }

        const currentSnapshot = {
            spot,
            primaryNode,
            nodes: structure.nodes ?? structure,
            structure
        };

        const previousSnapshot =
            marketState.previousSnapshot ?? null;

        const patternResults = this.detectors.map(detector => {

            try {
                return detector.analyze(
                    currentSnapshot,
                    previousSnapshot
                );
            }
            catch (error) {

                return {
                    name: detector.constructor.name,
                    stage: "ERROR",
                    confidence: 0,
                    confirmed: false,
                    reason: error.message
                };

            }

        });

        const normalize = result => ({

            name: result.name,
            stage: result.stage,
            confidence: result.confidence ?? 0,
            direction: result.direction ?? null,
            strike: result.strike ?? primaryNode.strike,
            nodeRole: result.nodeRole ?? primaryNode.role,
            distanceFromSpot:
                result.distanceFromSpot ??
                primaryNode.absoluteDistanceFromSpot,
            reason: result.reason,
            confirmed:
                result.confirmed === true ||
                result.detected === true

        });

        return {

            version: this.version,

            status:
                patternResults.some(r => r.confirmed || r.detected)
                    ? "PATTERN_ACTIVE"
                    : "ELIGIBLE_WAITING_FOR_PATTERN_DATA",

            locationEligible: true,
            nearMajorNode: true,

            primaryNode,
            nearbyMajorNodes,

            detectedPatterns:
                patternResults
                    .filter(r => r.confirmed || r.detected)
                    .map(normalize),

            candidatePatterns:
                patternResults
                    .filter(r =>
                        r.stage !== "WAITING_FOR_HISTORY" &&
                        r.stage !== "NO_LOCATION")
                    .map(normalize),

            requiredData: [
                "priceHistory",
                "nodeMagnitudeHistory",
                "nodeStrikeHistory"
            ],

            reason:
                "Pattern evaluation completed."

        };

    }

    collectMajorNodes(structure) {

        const nodes = [];

        const add = node => {

            if (!node || typeof node.strike !== "number") {
                return;
            }

            if (!nodes.some(n => n.strike === node.strike)) {
                nodes.push(node);
            }

        };

        add(structure.kingNode);
        add(structure.floor);
        add(structure.ceiling);
        add(structure.nearestNode);

        (structure.gatekeepers ?? []).forEach(add);
        (structure.nearbyNodes ?? []).forEach(add);

        if (structure.fortress?.nodes) {
            structure.fortress.nodes.forEach(add);
        }

        (structure.fortresses ?? []).forEach(fortress => {
            (fortress.nodes ?? []).forEach(add);
        });

        return nodes;

    }

}

export default HunterPatternEngine;