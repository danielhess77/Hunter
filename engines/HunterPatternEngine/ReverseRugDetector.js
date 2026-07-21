/**
 * ------------------------------------------------------------
 * Hunter Reverse Rug Detector
 * Version 2.5
 *
 * Compatible with current Hunter architecture.
 *
 * Detects:
 *     Reverse Rug
 *
 * Does NOT perform:
 *     - Trade grading
 *     - Relative Strength
 *     - Options Flow
 *     - Dark Pools
 *     - Execution
 *
 * ------------------------------------------------------------
 */

class HunterReverseRugDetector {

    detect(currentSnapshot, previousSnapshot = null) {

        const result = {
            pattern: "Reverse Rug",
            detected: false,
            confidence: 0,
            stage: "NONE",
            evidence: []
        };

        //--------------------------------------------------------
        // Snapshot validation
        //--------------------------------------------------------

        if (!currentSnapshot)
            return result;

        if (!currentSnapshot.location)
            return result;

        if (!currentSnapshot.location.eligible)
            return result;

        //--------------------------------------------------------
        // Gate 1
        // Institutional Location
        //--------------------------------------------------------

        const node = currentSnapshot.location.primaryNode;

        if (!node)
            return result;

        const allowedRoles = [
            "KING",
            "FLOOR",
            "FORTRESS",
            "GATEKEEPER"
        ];

        if (!allowedRoles.includes(node.role))
            return result;

        if (node.gammaSigned <= 0)
            return result;

        result.confidence += 40;

        result.evidence.push(
            "Positive institutional support nearby."
        );

        //--------------------------------------------------------
        // Gate 2
        // Institutional Structure
        //--------------------------------------------------------

        const nodes = currentSnapshot.structure?.nodes || [];

        const overheadNegative = nodes.some(n =>
            n.strike > currentSnapshot.identity.spot &&
            n.gammaSigned < 0
        );

        if (!overheadNegative)
            return result;

        result.confidence += 25;

        result.evidence.push(
            "Negative Gamma air pocket above price."
        );

        //--------------------------------------------------------
        // Future Compatibility
        //--------------------------------------------------------

        if (node.state) {

            if (
                node.state === "BUILDING" ||
                node.state === "STABLE"
            ) {

                result.confidence += 10;

                result.evidence.push(
                    "Support is stable/building."
                );

            }

            if (node.state === "WEAKENING")
                return result;
        }

        //--------------------------------------------------------
        // Migration Bonus
        //--------------------------------------------------------

        if (
            currentSnapshot.structure &&
            currentSnapshot.structure.migration
        ) {

            if (
                currentSnapshot.structure.migration === "UP"
            ) {

                result.confidence += 10;

                result.evidence.push(
                    "Institutional structure migrating higher."
                );

            }

            if (
                currentSnapshot.structure.migration === "DOWN"
            )
                return result;

        }

        //--------------------------------------------------------
        // Trigger
        //--------------------------------------------------------

        let trigger = false;

        if (
            previousSnapshot &&
            previousSnapshot.identity
        ) {

            const previousSpot =
                previousSnapshot.identity.spot;

            const currentSpot =
                currentSnapshot.identity.spot;

            // Bounce

            if (
                previousSpot <= node.strike &&
                currentSpot > previousSpot
            ) {

                trigger = true;

                result.evidence.push(
                    "Bounce from institutional support."
                );

            }

            // Reclaim

            if (
                previousSpot < node.strike &&
                currentSpot >= node.strike
            ) {

                trigger = true;

                result.evidence.push(
                    "Support successfully reclaimed."
                );

            }

        }
        else {

            trigger = true;

            result.evidence.push(
                "Institutional setup present."
            );

        }

        if (!trigger)
            return result;

        //--------------------------------------------------------
        // Success
        //--------------------------------------------------------

        result.detected = true;

        result.stage = "CONFIRMED";

        result.confidence =
            Math.min(result.confidence, 100);

        return result;

    }

}

module.exports = HunterReverseRugDetector;