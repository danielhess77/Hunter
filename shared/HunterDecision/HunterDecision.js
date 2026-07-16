/**
 * Hunter Decision Engine
 * Version: 1.0.0
 *
 * Converts a canonical HunterEvidence snapshot into one
 * explainable trade decision.
 *
 * Core rules:
 * - No trade away from a major institutional node.
 * - A valid pattern is required for a tradable grade.
 * - Structure, evolution, RS, flow and dark pools adjust conviction.
 * - Optional evidence confirms a thesis; it never creates one.
 * - Execution must provide defined risk and at least 2:1 reward/risk.
 * - Missing optional engines cannot manufacture an A+ grade.
 */

class HunterDecisionEngine {

    constructor(config = {}) {

        this.version = "1.0.0";

        this.config = {
            minimumRiskReward: 2,
            preferredRiskReward: 3,
            fullSizeGrade: "A",
            maxNodeTaps: 2,
            ...config
        };

        this.gradeRank = {
            "PASS": 0,
            "WATCHLIST": 1,
            "B": 2,
            "A": 3,
            "A+": 4
        };

    }

    analyze(evidence) {

        const snapshot =
            typeof evidence?.toJSON === "function"
                ? evidence.toJSON()
                : evidence;

        if (!snapshot) {
            return this.buildUnavailableDecision(
                "Canonical Hunter evidence was not supplied."
            );
        }

        const ledger = {
            supporting: [],
            conflicting: [],
            missing: [],
            gates: {}
        };

        const location = this.evaluateLocation(snapshot, ledger);
        ledger.gates.location = location;

        if (!location.passed) {
            return this.finalize({
                snapshot,
                ledger,
                grade: "PASS",
                direction: "NONE",
                confidence: "LOW",
                status: "NO_TRADE",
                reason: location.reason
            });
        }

        const pattern = this.evaluatePattern(snapshot, ledger);
        ledger.gates.pattern = pattern;

        if (pattern.blocked) {
            return this.finalize({
                snapshot,
                ledger,
                grade: "PASS",
                direction: "NONE",
                confidence: "LOW",
                status: "NO_TRADE",
                reason: pattern.reason
            });
        }

        if (!pattern.passed) {
            return this.finalize({
                snapshot,
                ledger,
                grade: "WATCHLIST",
                direction: pattern.direction,
                confidence: "LOW",
                status: "WAIT",
                reason: pattern.reason
            });
        }

        const direction = pattern.direction;

        const structure =
            this.evaluateStructure(snapshot, direction, ledger);
        ledger.gates.structure = structure;

        const evolution =
            this.evaluateEvolution(snapshot, direction, ledger);
        ledger.gates.evolution = evolution;

        const relativeStrength =
            this.evaluateOptionalDirectionalSection(
                snapshot.relativeStrength,
                direction,
                "Relative strength",
                ledger
            );
        ledger.gates.relativeStrength = relativeStrength;

        const optionsFlow =
            this.evaluateOptionalDirectionalSection(
                snapshot.optionsFlow,
                direction,
                "Options flow",
                ledger
            );
        ledger.gates.optionsFlow = optionsFlow;

        const darkPools =
            this.evaluateOptionalDirectionalSection(
                snapshot.darkPools,
                direction,
                "Dark pools",
                ledger
            );
        ledger.gates.darkPools = darkPools;

        const execution =
            this.evaluateExecution(snapshot, direction, ledger);
        ledger.gates.execution = execution;

        if (execution.failedHard) {
            return this.finalize({
                snapshot,
                ledger,
                grade: "PASS",
                direction,
                confidence: "LOW",
                status: "NO_TRADE",
                reason: execution.reason,
                execution
            });
        }

        if (!execution.passed) {
            return this.finalize({
                snapshot,
                ledger,
                grade: "WATCHLIST",
                direction,
                confidence: "LOW",
                status: "WAIT",
                reason: execution.reason,
                execution
            });
        }

        const scoring = this.score({
            pattern,
            structure,
            evolution,
            relativeStrength,
            optionsFlow,
            darkPools,
            execution,
            snapshot
        });

        return this.finalize({
            snapshot,
            ledger,
            grade: scoring.grade,
            direction,
            confidence: scoring.confidence,
            status: "ACTIONABLE",
            reason: scoring.reason,
            execution,
            score: scoring.score
        });

    }

    evaluateLocation(snapshot, ledger) {

        const location = snapshot.location ?? {};

        const passed =
            location.eligible === true ||
            location.nearMajorNode === true;

        if (passed) {
            ledger.supporting.push(
                this.evidenceItem(
                    "LOCATION",
                    "Price is near or approaching a major institutional node.",
                    location.primaryNode ?? location.nearestNode
                )
            );
        } else {
            ledger.conflicting.push(
                this.evidenceItem(
                    "LOCATION",
                    location.reason ??
                    "Price is not near a qualifying institutional node."
                )
            );
        }

        return {
            passed,
            reason: passed
                ? "Institutional location gate passed."
                : "Pass: Hunter does not trade midpoints."
        };

    }

    evaluatePattern(snapshot, ledger) {

        const pattern = snapshot.pattern ?? {};

        if (pattern.available !== true) {
            ledger.missing.push("Pattern Engine");
            return {
                passed: false,
                blocked: false,
                direction: "NONE",
                name: null,
                quality: 0,
                reason: "Watchlist: Pattern Engine evidence is unavailable."
            };
        }

        const detected =
            Array.isArray(pattern.detectedPatterns)
                ? pattern.detectedPatterns
                : [];

        const normalized =
            detected.map(item => this.normalizePattern(item));

        const blocker =
            normalized.find(item =>
                ["RAINBOW_ROAD", "WHIPSAW", "NO_TRADE"].includes(item.name)
            );

        if (blocker) {
            ledger.conflicting.push(
                this.evidenceItem(
                    "PATTERN",
                    `${blocker.name} is a no-trade environment.`,
                    blocker.raw
                )
            );

            return {
                passed: false,
                blocked: true,
                direction: "NONE",
                name: blocker.name,
                quality: 0,
                reason: `Pass: ${blocker.name} blocks the setup.`
            };
        }

        const tradable =
            normalized
                .filter(item => item.direction !== "NONE")
                .sort((a, b) => b.quality - a.quality)[0];

        if (!tradable) {
            ledger.conflicting.push(
                this.evidenceItem(
                    "PATTERN",
                    pattern.reason ??
                    "No valid institutional pattern is confirmed."
                )
            );

            return {
                passed: false,
                blocked: false,
                direction: "NONE",
                name: null,
                quality: 0,
                reason: "Watchlist: A valid institutional pattern has not formed."
            };
        }

        ledger.supporting.push(
            this.evidenceItem(
                "PATTERN",
                `${tradable.name} supports a ${tradable.direction.toLowerCase()} thesis.`,
                tradable.raw
            )
        );

        return {
            passed: true,
            blocked: false,
            direction: tradable.direction,
            name: tradable.name,
            quality: tradable.quality,
            reason: "Pattern gate passed."
        };

    }

    normalizePattern(item) {

        const object =
            typeof item === "string"
                ? { name: item }
                : (item ?? {});

        const rawName =
            object.name ??
            object.pattern ??
            object.type ??
            object.id ??
            "UNKNOWN";

        const name =
            String(rawName)
                .trim()
                .toUpperCase()
                .replace(/[\s-]+/g, "_");

        let direction =
            this.normalizeDirection(
                object.direction ??
                object.bias ??
                object.side
            );

        if (direction === "NONE") {
            const bullish = [
                "REVERSE_RUG",
                "BEACH_BALL",
                "BULLISH_DEFLECTION",
                "FLOOR_DEFLECTION",
                "BULLISH_TREND"
            ];

            const bearish = [
                "RUG",
                "BEARISH_DEFLECTION",
                "CEILING_DEFLECTION",
                "BEARISH_TREND"
            ];

            if (bullish.includes(name)) direction = "LONG";
            if (bearish.includes(name)) direction = "SHORT";

            if (name === "DEFLECTION") {
                direction =
                    this.normalizeDirection(
                        object.nodeRole ??
                        object.context
                    );
            }
        }

        const quality =
            this.numberOr(
                object.score ??
                object.confidenceScore ??
                object.quality,
                object.confirmed === false ? 1 : 2
            );

        return {
            name,
            direction,
            quality,
            raw: item
        };

    }

    evaluateStructure(snapshot, direction, ledger) {

        const structure = snapshot.structure ?? {};

        if (structure.available !== true) {
            ledger.missing.push("Institutional Structure Engine");
            return {
                available: false,
                alignment: 0,
                reason: "Structure evidence unavailable."
            };
        }

        const text = JSON.stringify(
            structure.evaluation ?? structure
        ).toUpperCase();

        const bullish =
            this.containsAny(text, [
                "BULLISH",
                "RISING FLOOR",
                "FLOOR ROLLING UP",
                "UPTREND"
            ]);

        const bearish =
            this.containsAny(text, [
                "BEARISH",
                "FALLING CEILING",
                "CEILING ROLLING DOWN",
                "DOWNTREND"
            ]);

        const choppy =
            this.containsAny(text, [
                "CHOPPY",
                "CHOP",
                "PINNED",
                "RANGE"
            ]);

        let alignment = 0;

        if (
            (direction === "LONG" && bullish) ||
            (direction === "SHORT" && bearish)
        ) {
            alignment = 2;
            ledger.supporting.push(
                this.evidenceItem(
                    "STRUCTURE",
                    `Institutional structure supports the ${direction.toLowerCase()} thesis.`,
                    structure.evaluation
                )
            );
        } else if (
            (direction === "LONG" && bearish) ||
            (direction === "SHORT" && bullish)
        ) {
            alignment = -2;
            ledger.conflicting.push(
                this.evidenceItem(
                    "STRUCTURE",
                    `Institutional structure opposes the ${direction.toLowerCase()} thesis.`,
                    structure.evaluation
                )
            );
        } else if (choppy) {
            alignment = -1;
            ledger.conflicting.push(
                this.evidenceItem(
                    "STRUCTURE",
                    "Structure is choppy or pinned; conviction is reduced.",
                    structure.evaluation
                )
            );
        } else {
            ledger.missing.push("Directional structure classification");
        }

        return {
            available: true,
            alignment,
            reason: alignment > 0
                ? "Structure aligned."
                : alignment < 0
                    ? "Structure conflicts or suppresses expansion."
                    : "Structure is neutral or unclassified."
        };

    }

    evaluateEvolution(snapshot, direction, ledger) {

        const evolution = snapshot.evolution ?? {};

        if (
            evolution.available !== true ||
            evolution.hasHistory !== true
        ) {
            ledger.missing.push("Institutional evolution history");
            return {
                available: false,
                alignment: 0,
                reason: "A prior snapshot is required."
            };
        }

        const changes =
            Array.isArray(evolution.nodeChanges)
                ? evolution.nodeChanges
                : [];

        let alignment = 0;

        for (const change of changes) {

            const text =
                JSON.stringify(change).toUpperCase();

            const bullish =
                this.containsAny(text, [
                    "ROLLING UP",
                    "MIGRATING UP",
                    "MOVED UP",
                    "BULLISH",
                    "RISING FLOOR",
                    "KING NODE UP"
                ]);

            const bearish =
                this.containsAny(text, [
                    "ROLLING DOWN",
                    "MIGRATING DOWN",
                    "MOVED DOWN",
                    "BEARISH",
                    "FALLING CEILING",
                    "KING NODE DOWN"
                ]);

            if (direction === "LONG") {
                if (bullish) alignment += 1.25;
                if (bearish) alignment -= 1.25;
            }

            if (direction === "SHORT") {
                if (bearish) alignment += 1.25;
                if (bullish) alignment -= 1.25;
            }
        }

        alignment = Math.max(-2.5, Math.min(2.5, alignment));

        if (alignment > 0) {
            ledger.supporting.push(
                this.evidenceItem(
                    "EVOLUTION",
                    "Node migration supports the trade direction.",
                    changes
                )
            );
        } else if (alignment < 0) {
            ledger.conflicting.push(
                this.evidenceItem(
                    "EVOLUTION",
                    "Node migration opposes the trade direction.",
                    changes
                )
            );
        }

        return {
            available: true,
            alignment,
            reason: alignment > 0
                ? "Migration aligned."
                : alignment < 0
                    ? "Migration conflicted."
                    : "No directional migration identified."
        };

    }

    evaluateOptionalDirectionalSection(
        section,
        direction,
        label,
        ledger
    ) {

        if (section?.available !== true) {
            ledger.missing.push(label);
            return {
                available: false,
                alignment: 0,
                reason: `${label} unavailable.`
            };
        }

        const data = section.data ?? section;
        const normalized =
            this.normalizeDirection(
                data.direction ??
                data.bias ??
                data.signal ??
                data.evaluation ??
                data.grade
            );

        let alignment = 0;

        if (normalized === direction) {
            alignment = 1;
            ledger.supporting.push(
                this.evidenceItem(
                    label.toUpperCase().replace(/\s+/g, "_"),
                    `${label} confirms the ${direction.toLowerCase()} thesis.`,
                    data
                )
            );
        } else if (
            normalized !== "NONE" &&
            normalized !== direction
        ) {
            alignment = -1;
            ledger.conflicting.push(
                this.evidenceItem(
                    label.toUpperCase().replace(/\s+/g, "_"),
                    `${label} conflicts with the ${direction.toLowerCase()} thesis.`,
                    data
                )
            );
        }

        return {
            available: true,
            alignment,
            reason: alignment > 0
                ? `${label} aligned.`
                : alignment < 0
                    ? `${label} conflicted.`
                    : `${label} neutral.`
        };

    }

    evaluateExecution(snapshot, direction, ledger) {

        const section = snapshot.execution ?? {};

        if (section.available !== true) {
            ledger.missing.push("Execution Engine");
            return {
                available: false,
                passed: false,
                failedHard: false,
                entry: null,
                stop: null,
                targets: [],
                riskReward: null,
                reason: "Watchlist: Entry, stop and target are not yet defined."
            };
        }

        const data = section.data ?? section;

        const entry =
            this.firstFinite(
                data.entry,
                data.entryPrice,
                data.entryZone?.mid,
                data.entryZone?.price
            );

        const stop =
            this.firstFinite(
                data.stop,
                data.stopPrice,
                data.invalidation
            );

        const targets =
            [
                data.target1,
                data.target2,
                data.target,
                ...(Array.isArray(data.targets) ? data.targets : [])
            ]
                .map(value =>
                    typeof value === "object"
                        ? this.firstFinite(value.price, value.level)
                        : Number(value)
                )
                .filter(Number.isFinite);

        let riskReward =
            this.firstFinite(
                data.riskReward,
                data.rewardRisk,
                data.rr
            );

        if (
            !Number.isFinite(riskReward) &&
            Number.isFinite(entry) &&
            Number.isFinite(stop) &&
            targets.length > 0
        ) {
            const risk = Math.abs(entry - stop);
            const reward = Math.abs(targets[0] - entry);

            if (risk > 0) {
                riskReward = reward / risk;
            }
        }

        const liquidityOk =
            data.liquiditySufficient !== false &&
            data.liquidity !== "INSUFFICIENT";

        const tapCount =
            this.firstFinite(
                data.nodeTaps,
                data.tapCount,
                data.tests
            );

        const tapsOk =
            !Number.isFinite(tapCount) ||
            tapCount <= this.config.maxNodeTaps;

        const geometryValid =
            Number.isFinite(entry) &&
            Number.isFinite(stop) &&
            targets.length > 0 &&
            this.geometryMatchesDirection(
                direction,
                entry,
                stop,
                targets[0]
            );

        const rrPassed =
            Number.isFinite(riskReward) &&
            riskReward >= this.config.minimumRiskReward;

        const failedHard =
            data.invalid === true ||
            data.liquiditySufficient === false ||
            (Number.isFinite(riskReward) &&
                riskReward < this.config.minimumRiskReward);

        const passed =
            geometryValid &&
            rrPassed &&
            liquidityOk &&
            tapsOk;

        if (passed) {
            ledger.supporting.push(
                this.evidenceItem(
                    "EXECUTION",
                    `Execution is defined with ${riskReward.toFixed(2)}:1 reward/risk.`,
                    data
                )
            );
        } else {
            ledger.conflicting.push(
                this.evidenceItem(
                    "EXECUTION",
                    this.executionFailureReason({
                        geometryValid,
                        rrPassed,
                        liquidityOk,
                        tapsOk
                    }),
                    data
                )
            );
        }

        return {
            available: true,
            passed,
            failedHard,
            entry,
            stop,
            targets,
            riskReward,
            liquidityOk,
            tapCount: Number.isFinite(tapCount)
                ? tapCount
                : null,
            tapsOk,
            reason: passed
                ? "Execution gate passed."
                : this.executionFailureReason({
                    geometryValid,
                    rrPassed,
                    liquidityOk,
                    tapsOk
                })
        };

    }

    score(parts) {

        let score = 0;

        score += Math.min(3, Math.max(1, parts.pattern.quality));
        score += parts.structure.alignment;
        score += parts.evolution.alignment;
        score += parts.relativeStrength.alignment;
        score += parts.optionsFlow.alignment;
        score += parts.darkPools.alignment;

        if (
            parts.execution.riskReward >=
            this.config.preferredRiskReward
        ) {
            score += 1;
        }

        const optionalAvailable = [
            parts.relativeStrength,
            parts.optionsFlow,
            parts.darkPools
        ].filter(item => item.available).length;

        const conflicts = [
            parts.structure,
            parts.evolution,
            parts.relativeStrength,
            parts.optionsFlow,
            parts.darkPools
        ].filter(item => item.alignment < 0).length;

        let grade;

        if (
            score >= 8 &&
            conflicts === 0 &&
            optionalAvailable >= 2 &&
            parts.execution.riskReward >=
                this.config.preferredRiskReward
        ) {
            grade = "A+";
        } else if (
            score >= 5 &&
            conflicts <= 1
        ) {
            grade = "A";
        } else {
            grade = "B";
        }

        // Mediocre/weak RS cannot receive A+.
        if (
            grade === "A+" &&
            parts.relativeStrength.available &&
            parts.relativeStrength.alignment <= 0
        ) {
            grade = "A";
        }

        const confidence =
            grade === "A+" || grade === "A"
                ? "HIGH"
                : "MEDIUM";

        return {
            grade,
            confidence,
            score: Number(score.toFixed(2)),
            reason:
                grade === "A+"
                    ? "Exceptional institutional alignment with preferred execution."
                    : grade === "A"
                        ? "Excellent setup with strong multi-engine alignment."
                        : "Tradable setup, but conviction or confirmation is incomplete."
        };

    }

    finalize({
        snapshot,
        ledger,
        grade,
        direction,
        confidence,
        status,
        reason,
        execution = null,
        score = null
    }) {

        const positionSize =
            grade === "A+"
                ? "FULL"
                : grade === "A"
                    ? "STANDARD"
                    : grade === "B"
                        ? "REDUCED"
                        : grade === "WATCHLIST"
                            ? "STARTER_ONLY_AFTER_TRIGGER"
                            : "NONE";

        const primaryPattern =
            ledger.gates.pattern?.name ?? null;

        const primaryNode =
            snapshot.location?.primaryNode ??
            snapshot.location?.nearestNode ??
            null;

        return {
            version: this.version,
            symbol: snapshot.identity?.symbol ?? null,
            spot: snapshot.identity?.spot ?? null,
            status,
            grade,
            direction,
            confidence,
            score,
            positionSize,
            thesis: this.buildThesis({
                grade,
                direction,
                primaryPattern,
                primaryNode,
                reason
            }),
            primaryPattern,
            primaryNode,
            execution: {
                entry: execution?.entry ?? null,
                stop: execution?.stop ?? null,
                targets: execution?.targets ?? [],
                riskReward: execution?.riskReward ?? null
            },
            gates: ledger.gates,
            supportingEvidence: ledger.supporting,
            conflictingEvidence: ledger.conflicting,
            missingEvidence: [...new Set(ledger.missing)],
            explanation: this.buildExplanation({
                grade,
                direction,
                reason,
                ledger,
                execution
            }),
            createdAt: new Date().toISOString()
        };

    }

    buildThesis({
        grade,
        direction,
        primaryPattern,
        primaryNode,
        reason
    }) {

        if (grade === "PASS") {
            return reason;
        }

        if (grade === "WATCHLIST") {
            return reason;
        }

        const nodeText =
            primaryNode?.strike ??
            primaryNode?.price ??
            primaryNode?.level ??
            null;

        return [
            `${grade} ${direction.toLowerCase()} setup`,
            primaryPattern
                ? `using ${primaryPattern}`
                : null,
            nodeText !== null
                ? `at institutional node ${nodeText}`
                : null
        ]
            .filter(Boolean)
            .join(" ");
    }

    buildExplanation({
        grade,
        direction,
        reason,
        ledger,
        execution
    }) {

        const support =
            ledger.supporting.map(item => item.message);

        const conflict =
            ledger.conflicting.map(item => item.message);

        return {
            verdict:
                `${grade} | ${direction} | ${reason}`,
            whyItWorks: support,
            whatCouldInvalidate: conflict,
            execution:
                execution?.passed
                    ? `Entry ${execution.entry}, stop ${execution.stop}, ` +
                      `target ${execution.targets[0]}, ` +
                      `${execution.riskReward.toFixed(2)}:1 reward/risk.`
                    : execution?.reason ??
                      "Execution is not yet available."
        };

    }

    buildUnavailableDecision(reason) {

        return {
            version: this.version,
            symbol: null,
            spot: null,
            status: "NO_TRADE",
            grade: "PASS",
            direction: "NONE",
            confidence: "LOW",
            score: null,
            positionSize: "NONE",
            thesis: reason,
            primaryPattern: null,
            primaryNode: null,
            execution: {
                entry: null,
                stop: null,
                targets: [],
                riskReward: null
            },
            gates: {},
            supportingEvidence: [],
            conflictingEvidence: [],
            missingEvidence: ["HunterEvidence"],
            explanation: {
                verdict: `PASS | NONE | ${reason}`,
                whyItWorks: [],
                whatCouldInvalidate: [reason],
                execution: "Execution is unavailable."
            },
            createdAt: new Date().toISOString()
        };

    }

    normalizeDirection(value) {

        if (value === null || value === undefined) {
            return "NONE";
        }

        const text =
            typeof value === "string"
                ? value.toUpperCase()
                : JSON.stringify(value).toUpperCase();

        if (
            this.containsAny(text, [
                "LONG",
                "BULLISH",
                "UPSIDE",
                "BUY",
                "FLOOR",
                "SUPPORT"
            ])
        ) {
            return "LONG";
        }

        if (
            this.containsAny(text, [
                "SHORT",
                "BEARISH",
                "DOWNSIDE",
                "SELL",
                "CEILING",
                "RESISTANCE"
            ])
        ) {
            return "SHORT";
        }

        return "NONE";

    }

    geometryMatchesDirection(direction, entry, stop, target) {

        if (direction === "LONG") {
            return stop < entry && target > entry;
        }

        if (direction === "SHORT") {
            return stop > entry && target < entry;
        }

        return false;

    }

    executionFailureReason({
        geometryValid,
        rrPassed,
        liquidityOk,
        tapsOk
    }) {

        if (!liquidityOk) {
            return "Pass: Liquidity is insufficient.";
        }

        if (!tapsOk) {
            return "Watchlist: The key node has been tested too many times.";
        }

        if (!geometryValid) {
            return "Watchlist: Entry, stop and directional target are not fully defined.";
        }

        if (!rrPassed) {
            return `Pass: Reward/risk is below ${this.config.minimumRiskReward}:1.`;
        }

        return "Watchlist: Execution is incomplete.";

    }

    evidenceItem(source, message, data = null) {

        return {
            source,
            message,
            data
        };

    }

    containsAny(text, values) {

        return values.some(value => text.includes(value));

    }

    numberOr(value, fallback) {

        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;

    }

    firstFinite(...values) {

        for (const value of values) {
            const number = Number(value);
            if (Number.isFinite(number)) return number;
        }

        return null;

    }

}

export default HunterDecisionEngine;