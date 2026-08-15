/**
 * Hunter Decision Engine
 * Version: 0.8.0
 *
 * Combines Institutional Structure + Pattern Engine output
 * into a single actionable decision.
 *
 * Philosophy:
 * - Structure provides location quality and key levels
 * - Patterns provide timing and directional bias
 * - Decision only becomes aggressive when both align
 */

class HunterDecisionEngine {

    analyze(structure, patterns = null) {

        const reasons = [];
        let score = 0;

        //--------------------------------------------------
        // Guard: empty / invalid structure
        //--------------------------------------------------

        if (!structure || typeof structure !== "object") {

            return this._buildResult({
                score: 0,
                grade: "Pass",
                action: "AVOID",
                direction: null,
                confidence: 0,
                reasons: ["No institutional structure available."],
                keyLevels: null,
                primaryPattern: null,
                locationEligible: false
            });

        }

        const nearestNode = structure.nearestNode || null;
        const nearestDistance =
            typeof structure.nearestDistance === "number"
                ? structure.nearestDistance
                : null;

        const nearbyNodes = Array.isArray(structure.nearbyNodes)
            ? structure.nearbyNodes
            : [];

        const kingGamma = structure.kingGammaNode || structure.kingNode || null;
        const strongestAbove = structure.strongestNodeAboveSpot || null;
        const strongestBelow = structure.strongestNodeBelowSpot || null;

        //--------------------------------------------------
        // 1. Location / Structure Scoring
        //--------------------------------------------------

        const nearMajorNode =
            nearestDistance !== null && nearestDistance <= 2;

        if (nearMajorNode && strongestBelow) {
            score += 25;
            reasons.push("Price is near institutional demand (strongest node below)."
            );
        }

        if (nearMajorNode && strongestAbove) {
            score += 10;
            reasons.push("Institutional resistance exists above (upside liquidity)."
            );
        }

        if (
            kingGamma &&
            nearestNode &&
            Math.abs(kingGamma.strike - nearestNode.strike) <= 2
        ) {
            score += 20;
            reasons.push("Trading near King Gamma.");
        }

        if (nearbyNodes.length >= 3) {
            score += 12;
            reasons.push("Multiple institutional nodes clustered nearby.");
        }

        if (nearbyNodes.length >= 5) {
            score += 8;
            reasons.push("High-density institutional liquidity zone.");
        }

        //--------------------------------------------------
        // 2. Pattern Engine Integration
        //--------------------------------------------------

        let primaryPattern = null;
        let patternBoost = 0;
        let patternDirection = null;
        let locationEligible = false;

        if (patterns && typeof patterns === "object") {

            locationEligible = patterns.locationEligible === true;

            const confirmed = Array.isArray(patterns.detectedPatterns)
                ? patterns.detectedPatterns
                : [];

            const candidates = Array.isArray(patterns.candidatePatterns)
                ? patterns.candidatePatterns
                : [];

            // Prefer confirmed patterns, then highest-confidence candidate
            const ranked = [
                ...confirmed.map(p => ({ ...p, _confirmed: true })),
                ...candidates
                    .filter(p => p && p.stage !== "WAITING_FOR_HISTORY" && p.stage !== "NO_LOCATION")
                    .map(p => ({ ...p, _confirmed: false }))
            ].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

            primaryPattern = ranked[0] || null;

            if (primaryPattern) {

                patternDirection = primaryPattern.direction || null;

                if (primaryPattern._confirmed) {
                    patternBoost = Math.min(35, Math.round((primaryPattern.confidence || 50) * 0.35));
                    reasons.push(
                        `Confirmed pattern: ${primaryPattern.name} (${primaryPattern.stage}, ${primaryPattern.confidence || 0}% confidence).`
                    );
                } else {
                    patternBoost = Math.min(20, Math.round((primaryPattern.confidence || 30) * 0.25));
                    reasons.push(
                        `Candidate pattern: ${primaryPattern.name} (${primaryPattern.stage}).`
                    );
                }

                score += patternBoost;

            } else if (locationEligible) {

                reasons.push("Location eligible but no active pattern yet.");

            } else if (patterns.reason) {

                reasons.push(patterns.reason);

            }

        }

        //--------------------------------------------------
        // 3. Grade + Action
        //--------------------------------------------------

        let grade = "Pass";
        if (score >= 75) grade = "A";
        else if (score >= 55) grade = "B";
        else if (score >= 35) grade = "Watch";

        let action = "AVOID";

        if (!nearMajorNode && !locationEligible) {
            action = "AVOID";
        } else if (score >= 70 && primaryPattern && primaryPattern._confirmed) {
            action = "TAKE";
        } else if (score >= 50 && (primaryPattern || nearMajorNode)) {
            action = "SETUP";
        } else if (score >= 30 || nearMajorNode || locationEligible) {
            action = "WATCH";
        }

        //--------------------------------------------------
        // 4. Direction (pattern first, then structure bias)
        //--------------------------------------------------

        let direction = patternDirection;

        if (!direction && nearMajorNode && nearestNode) {

            // Simple structural bias: if nearest major node is below → potential support bounce
            if (strongestBelow && nearestNode.strike === strongestBelow.strike) {
                direction = "BULLISH_BIAS";
            } else if (strongestAbove && nearestNode.strike === strongestAbove.strike) {
                direction = "BEARISH_BIAS";
            } else {
                direction = "NEUTRAL";
            }

        }

        //--------------------------------------------------
        // 5. Key Levels (targets / stops derived from nodes)
        //--------------------------------------------------

        const keyLevels = this._deriveKeyLevels({
            nearestNode,
            strongestAbove,
            strongestBelow,
            kingGamma,
            nearbyNodes
        });

        //--------------------------------------------------
        // 6. Confidence (0-100)
        //--------------------------------------------------

        let confidence = Math.min(95, Math.round(score * 0.9));

        if (action === "AVOID") confidence = Math.min(confidence, 25);
        if (action === "WATCH") confidence = Math.min(confidence, 45);
        if (action === "SETUP") confidence = Math.max(confidence, 50);
        if (action === "TAKE") confidence = Math.max(confidence, 70);

        return this._buildResult({
            score,
            grade,
            action,
            direction,
            confidence,
            reasons,
            keyLevels,
            primaryPattern: primaryPattern
                ? {
                    name: primaryPattern.name,
                    stage: primaryPattern.stage,
                    confidence: primaryPattern.confidence,
                    direction: primaryPattern.direction,
                    strike: primaryPattern.strike,
                    confirmed: !!primaryPattern._confirmed
                }
                : null,
            locationEligible: locationEligible || nearMajorNode
        });

    }

    //--------------------------------------------------
    // Helpers
    //--------------------------------------------------

    _deriveKeyLevels({
        nearestNode,
        strongestAbove,
        strongestBelow,
        kingGamma,
        nearbyNodes
    }) {

        if (!nearestNode && !strongestAbove && !strongestBelow) {
            return null;
        }

        const support =
            strongestBelow?.strike ??
            (nearestNode && nearestNode.strike < (strongestAbove?.strike ?? Infinity)
                ? nearestNode.strike
                : null);

        const resistance =
            strongestAbove?.strike ??
            (nearestNode && nearestNode.strike > (strongestBelow?.strike ?? -Infinity)
                ? nearestNode.strike
                : null);

        // Simple target / stop framing around the nearest major node
        let target = null;
        let stop = null;

        if (nearestNode) {

            // Conservative defaults: next major node in the direction of bias
            if (strongestAbove && nearestNode.strike <= strongestAbove.strike) {
                target = strongestAbove.strike;
            }

            if (strongestBelow && nearestNode.strike >= strongestBelow.strike) {
                stop = strongestBelow.strike;
            }

            // Fallback: use King Gamma as a magnet / target if it is not the current node
            if (!target && kingGamma && kingGamma.strike !== nearestNode.strike) {
                target = kingGamma.strike;
            }

        }

        return {
            nearest: nearestNode?.strike ?? null,
            support,
            resistance,
            kingGamma: kingGamma?.strike ?? null,
            target,
            stop,
            nearbyStrikes: nearbyNodes
                .slice(0, 6)
                .map(n => n.strike)
                .filter(s => typeof s === "number")
        };

    }

    _buildResult({
        score,
        grade,
        action,
        direction,
        confidence,
        reasons,
        keyLevels,
        primaryPattern,
        locationEligible
    }) {

        return {
            version: "0.8.0",
            score,
            grade,
            action,          // AVOID | WATCH | SETUP | TAKE
            direction,       // pattern direction or structural bias
            confidence,      // 0-100
            reasons,
            keyLevels,       // support / resistance / target / stop
            primaryPattern,
            locationEligible
        };

    }

}

export default HunterDecisionEngine;
