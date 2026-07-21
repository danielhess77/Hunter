/**
 * Hunter Base Pattern Detector
 * Version: 2.0.0
 *
 * Foundation class for all Hunter institutional
 * pattern detectors.
 *
 * Responsibilities:
 * - Standardized detector result contract
 * - Common runtime states
 * - Shared confidence levels
 * - Stage constants
 * - Common detector metadata
 *
 * Individual detectors are responsible ONLY for
 * their pattern-specific logic.
 */

class BasePatternDetector {

    constructor(name) {

        if (!name) {

            throw new Error(
                "Pattern detector requires a name."
            );

        }

        this.name = name;

        this.version = "2.0.0";

        this.type = "PATTERN";

        //--------------------------------------------------
        // Standard Pattern Stages
        //--------------------------------------------------

        this.STAGES = {

            WATCHING: "WATCHING",

            APPROACH: "APPROACH",

            CONTACT: "CONTACT",

            REJECTION: "REJECTION",

            CONFIRMED: "CONFIRMED",

            WAITING_FOR_HISTORY: "WAITING_FOR_HISTORY",

            NO_LOCATION: "NO_LOCATION"

        };

        //--------------------------------------------------
        // Standard Confidence Levels
        //--------------------------------------------------

        this.CONFIDENCE = {

            WATCHING: 10,

            APPROACH: 30,

            CONTACT: 50,

            REJECTION: 60,

            CONFIRMED: 90

        };

    }

    //--------------------------------------------------
    // Standard Result Factory
    //--------------------------------------------------

    createResult({

        detected = false,

        stage = this.STAGES.WATCHING,

        confidence = 0,

        direction = null,

        strike = null,

        nodeRole = null,

        node = null,

        distanceFromSpot = null,

        evidence = [],

        reason = ""

    } = {}) {

        return {

            name: this.name,

            version: this.version,

            type: this.type,

            detected,

            confirmed: detected,

            stage,

            confidence,

            direction,

            strike,

            nodeRole,

            node,

            distanceFromSpot,

            evidence,

            reason,

            timestamp: Date.now()

        };

    }

    //--------------------------------------------------
    // Runtime States
    //--------------------------------------------------

    waitingForHistory(currentSnapshot = {}) {

        const node =
            currentSnapshot.location?.primaryNode ??
            currentSnapshot.primaryNode ??
            null;

        return this.createResult({

            stage:
                this.STAGES.WAITING_FOR_HISTORY,

            confidence: 0,

            strike:
                node?.strike ?? null,

            nodeRole:
                node?.role ?? null,

            node,

            distanceFromSpot:
                node?.distanceFromSpot ?? null,

            reason:
                "Waiting for previous snapshot."

        });

    }

    //--------------------------------------------------

    noLocation() {

        return this.createResult({

            stage:
                this.STAGES.NO_LOCATION,

            confidence: 0,

            reason:
                "No eligible institutional node."

        });

    }

    //--------------------------------------------------
    // Shared Confidence Helper
    //--------------------------------------------------

    calculateConfidence(stage) {

        return this.CONFIDENCE[stage] || 0;

    }

    //--------------------------------------------------
    // Shared Evidence Helper
    //--------------------------------------------------

    addEvidence(evidence, item) {

        if (!item)
            return;

        if (!Array.isArray(evidence))
            return;

        if (!evidence.includes(item))
            evidence.push(item);

    }

    //--------------------------------------------------
    // Shared Node Distance Helper
    //--------------------------------------------------

    calculateStrikeDistance(spot, strike) {

        if (
            spot == null ||
            strike == null
        ) {

            return null;

        }

        return Math.abs(spot - strike);

    }

}

export default BasePatternDetector;