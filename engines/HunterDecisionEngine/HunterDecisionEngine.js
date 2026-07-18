/**
 * Hunter Decision Engine
 * Version: 2.0.0
 *
 * Purpose:
 * - Convert canonical Hunter evidence into one explainable decision.
 * - Enforce Hunter's required pillars in order.
 * - Distinguish DATA_ERROR from PASS.
 * - Treat RS, options flow, dark pools, and evolution as confirmation.
 *
 * Important:
 * This engine never parses raw Skylit data.
 * It consumes normalized evidence only.
 */

class HunterDecisionEngine {

    constructor(config = {}) {

        this.version = "2.0.0";

        this.config = {
            minimumRiskReward: 2,
            preferredRiskReward: 3,
            maxNodeTaps: 2,
            requireLocation: true,
            requirePattern: true,
            requireExecution: true,
            ...config
        };

        this.gradeRank = {
            PASS: 0,
            WATCHLIST: 1,
            B: 2,
            A: 3,
            "A+": 4
        };

    }

    /**
     * Primary decision interface.
     *
     * @param {Object} evidence HunterEvidence instance or plain object.
     * @returns {Object}
     */
    analyze(evidence) {

        const snapshot =
            typeof evidence?.toJSON === "function"
                ? evidence.toJSON()
                : evidence;

        if (!snapshot || typeof snapshot !== "object") {
            return this.buildDataError(
                "HunterEvidence was not supplied."
            );
        }

        const marketState =
            snapshot.marketState ??
            snapshot.identity ??
            null;

        if (
            snapshot.marketState?.valid === false
        ) {
            return this.buildDataError(
                snapshot.marketState.reason ??
                "Canonical MarketState is invalid.",
                snapshot
            );
        }

        const ledger = {
            supporting: [],
            conflicting: [],
            missing: [],
            gates: {}
        };

        const identity =
            this.resolveIdentity(snapshot);

        const location =
            this.evaluateLocation(
                snapshot,
                ledger
            );

        ledger.gates.location =
            location;

        if (
            this.config.requireLocation &&
            !location.passed
        ) {
            return this.finalize({
                snapshot,
                identity,
                ledger,
                grade: "PASS",
                direction: "NONE",
                confidence: "LOW",
                status: "NO_TRADE",
                reason:
                    location.reason
            });
        }

        const pattern =
            this.evaluatePattern(
                snapshot,
                ledger
            );

        ledger.gates.pattern =
            pattern;

        if (pattern.blocked) {
            return this.finalize({
                snapshot,
                identity,
                ledger,
                grade: "PASS",
                direction: "NONE",
                confidence: "LOW",
                status: "NO_TRADE",
                reason:
                    pattern.reason
            });
        }

        if (
            this.config.requirePattern &&
            !pattern.passed
        ) {
            return this.finalize({
                snapshot,
                identity,
                ledger,
                grade: "WATCHLIST",
                direction:
                    pattern.direction,
                confidence: "LOW",
                status: "WAIT",
                reason:
                    pattern.reason
            });
        }

        const direction =
            pattern.direction;

        const structure =
            this.evaluateStructure(
                snapshot,
                direction,
                ledger
            );

        ledger.gates.structure =
            structure;

        const evolution =
            this.evaluateDirectionalSection(
                this.resolveSection(
                    snapshot,
                    "evolution"
                ),
                direction,
                "Evolution",
                ledger,
                {
                    unavailableIsMissing: true,
                    strongWeight: 1.25
                }
            );

        ledger.gates.evolution =
            evolution;

        const relativeStrength =
            this.evaluateDirectionalSection(
                this.resolveSection(
                    snapshot,
                    "relativeStrength"
                ),
                direction,
                "Relative Strength",
                ledger,
                {
                    unavailableIsMissing: true,
                    strongWeight: 1
                }
            );

        ledger.gates.relativeStrength =
            relativeStrength;

        const optionsFlow =
            this.evaluateDirectionalSection(
                this.resolveSection(
                    snapshot,
                    "optionsFlow"
                ),
                direction,
                "Options Flow",
                ledger,
                {
                    unavailableIsMissing: true,
                    strongWeight: 1
                }
            );

        ledger.gates.optionsFlow =
            optionsFlow;

        const darkPools =
            this.evaluateDirectionalSection(
                this.resolveSection(
                    snapshot,
                    "darkPools"
                ),
                direction,
                "Dark Pools",
                ledger,
                {
                    unavailableIsMissing: true,
                    strongWeight: 1
                }
            );

        ledger.gates.darkPools =
            darkPools;

        const execution =
            this.evaluateExecution(
                snapshot,
                direction,
                ledger
            );

        ledger.gates.execution =
            execution;

        if (
            this.config.requireExecution &&
            execution.failedHard
        ) {
            return this.finalize({
                snapshot,
                identity,
                ledger,
                grade: "PASS",
                direction,
                confidence: "LOW",
                status: "NO_TRADE",
                reason:
                    execution.reason,
                execution
            });
        }

        if (
            this.config.requireExecution &&
            !execution.passed
        ) {
            return this.finalize({
                snapshot,
                identity,
                ledger,
                grade: "WATCHLIST",
                direction,
                confidence: "LOW",
                status: "WAIT",
                reason:
                    execution.reason,
                execution
            });
        }

        const scoring =
            this.score({
                pattern,
                structure,
                evolution,
                relativeStrength,
                optionsFlow,
                darkPools,
                execution
            });

        return this.finalize({
            snapshot,
            identity,
            ledger,
            grade:
                scoring.grade,
            direction,
            confidence:
                scoring.confidence,
            status:
                "ACTIONABLE",
            reason:
                scoring.reason,
            execution,
            score:
                scoring.score
        });

    }

    resolveIdentity(snapshot) {

        const marketState =
            snapshot.marketState ??
            {};

        const identity =
            snapshot.identity ??
            {};

        return {
            symbol:
                identity.symbol ??
                marketState.symbol ??
                null,

            spot:
                this.firstFinite(
                    identity.spot,
                    identity.currentSpot,
                    marketState.currentSpot,
                    marketState.spot
                )
        };

    }

    resolveSection(
        snapshot,
        key
    ) {

        if (
            snapshot[key] !== undefined
        ) {
            return snapshot[key];
        }

        if (
            snapshot.evidence &&
            snapshot.evidence[key] !==
            undefined
        ) {
            return snapshot.evidence[key];
        }

        return null;

    }

    evaluateLocation(
        snapshot,
        ledger
    ) {

    const map =
        snapshot.map ??
        snapshot.structure?.map ??
        snapshot.nodes ??
        {};

        console.log({
        hasNearestNode: !!map.nearestNode,
        nearestNode: map.nearestNode,
        distance: map.nearestNode?.absoluteDistanceInStrikes
        });
        
        const location =
            this.resolveSection(
            snapshot,
            "location"
            ) ?? {};

        const nearestNode =
            map.nearestNode ??
            location.primaryNode ??
            location.nearestNode ??
            null;

        const distanceInStrikes =
            nearestNode?.absoluteDistanceInStrikes ??
            Number.POSITIVE_INFINITY;

        const nearMajorNode =
            distanceInStrikes <= 2;

        const passed =
            nearMajorNode ||
            location.eligible === true ||
            location.passed === true;

        const primaryNode = nearestNode;

        if (passed) {

            ledger.supporting.push(
                this.evidenceItem(
                    "LOCATION",
                    "Price is near or approaching a major institutional node.",
                    primaryNode
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
            primaryNode,
            reason:
                passed
                    ? "Institutional location gate passed."
                    : (
                        location.reason ??
                        "Pass: Hunter does not trade midpoints."
                    )
        };

    }

    evaluatePattern(
        snapshot,
        ledger
    ) {

        const pattern =
            this.resolveSection(
                snapshot,
                "pattern"
            ) ??
            this.resolveSection(
                snapshot,
                "patterns"
            ) ??
            {};

        if (
            pattern.available === false
        ) {
            ledger.missing.push(
                "Pattern Engine"
            );

            return {
                passed: false,
                blocked: false,
                direction: "NONE",
                name: null,
                quality: 0,
                reason:
                    pattern.reason ??
                    "Watchlist: Pattern evidence is unavailable."
            };
        }

        const detected =
            Array.isArray(
                pattern.detectedPatterns
            )
                ? pattern.detectedPatterns
                : Array.isArray(pattern)
                    ? pattern
                    : [];

        const normalized =
            detected.map(item =>
                this.normalizePattern(item)
            );

        const blocker =
            normalized.find(item =>
                [
                    "RAINBOW_ROAD",
                    "WHIPSAW",
                    "NO_TRADE"
                ].includes(item.name)
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
                reason:
                    `Pass: ${blocker.name} blocks the setup.`
            };

        }

        const tradable =
            normalized
                .filter(item =>
                    item.direction === "LONG" ||
                    item.direction === "SHORT"
                )
                .sort(
                    (a, b) =>
                        b.quality -
                        a.quality
                )[0];

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
                reason:
                    "Watchlist: A valid institutional pattern has not formed."
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
            direction:
                tradable.direction,
            name:
                tradable.name,
            quality:
                tradable.quality,
            reason:
                "Pattern gate passed."
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

            if (
                bullish.includes(name)
            ) {
                direction = "LONG";
            }

            if (
                bearish.includes(name)
            ) {
                direction = "SHORT";
            }

            if (
                name === "DEFLECTION" ||
                name === "SIMPLE_DEFLECTION"
            ) {
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
                object.confirmed === false
                    ? 1
                    : 2
            );

        return {
            name,
            direction,
            quality,
            raw: item
        };

    }

    evaluateStructure(
        snapshot,
        direction,
        ledger
    ) {

        const structure =
            this.resolveSection(
                snapshot,
                "structure"
            ) ??
            {};

        if (
            structure.available === false
        ) {
            ledger.missing.push(
                "Structure Engine"
            );

            return {
                available: false,
                alignment: 0,
                reason:
                    structure.reason ??
                    "Structure evidence unavailable."
            };
        }

        const text =
            JSON.stringify(
                structure.evaluation ??
                structure.state ??
                structure
            ).toUpperCase();

        const bullish =
            this.containsAny(
                text,
                [
                    "BULLISH",
                    "RISING FLOOR",
                    "FLOOR ROLLING UP",
                    "UPTREND"
                ]
            );

        const bearish =
            this.containsAny(
                text,
                [
                    "BEARISH",
                    "FALLING CEILING",
                    "CEILING ROLLING DOWN",
                    "DOWNTREND"
                ]
            );

        const suppressed =
            this.containsAny(
                text,
                [
                    "CHOPPY",
                    "CHOP",
                    "PINNED",
                    "RANGE"
                ]
            );

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
                    structure
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
                    structure
                )
            );

        } else if (suppressed) {

            alignment = -1;

            ledger.conflicting.push(
                this.evidenceItem(
                    "STRUCTURE",
                    "Structure is choppy or pinned; expansion conviction is reduced.",
                    structure
                )
            );

        } else {

            ledger.missing.push(
                "Directional structure classification"
            );

        }

        return {
            available: true,
            alignment,
            reason:
                alignment > 0
                    ? "Structure aligned."
                    : alignment < 0
                        ? "Structure conflicts or suppresses expansion."
                        : "Structure is neutral or unclassified."
        };

    }

    evaluateDirectionalSection(
        section,
        direction,
        label,
        ledger,
        options = {}
    ) {

        const {
            unavailableIsMissing = true,
            strongWeight = 1
        } = options;

        if (
            !section ||
            section.available === false
        ) {

            if (unavailableIsMissing) {
                ledger.missing.push(
                    label
                );
            }

            return {
                available: false,
                alignment: 0,
                reason:
                    section?.reason ??
                    `${label} unavailable.`
            };

        }

        const data =
            section.data ??
            section;

        const normalized =
            this.normalizeDirection(
                data.direction ??
                data.bias ??
                data.signal ??
                data.evaluation ??
                data.grade
            );

        let alignment = 0;

        if (
            normalized === direction
        ) {

            alignment =
                strongWeight;

            ledger.supporting.push(
                this.evidenceItem(
                    label
                        .toUpperCase()
                        .replace(/\s+/g, "_"),
                    `${label} confirms the ${direction.toLowerCase()} thesis.`,
                    data
                )
            );

        } else if (
            normalized !== "NONE" &&
            normalized !== direction
        ) {

            alignment =
                -strongWeight;

            ledger.conflicting.push(
                this.evidenceItem(
                    label
                        .toUpperCase()
                        .replace(/\s+/g, "_"),
                    `${label} conflicts with the ${direction.toLowerCase()} thesis.`,
                    data
                )
            );

        }

        return {
            available: true,
            alignment,
            reason:
                alignment > 0
                    ? `${label} aligned.`
                    : alignment < 0
                        ? `${label} conflicted.`
                        : `${label} neutral.`
        };

    }

    evaluateExecution(
        snapshot,
        direction,
        ledger
    ) {

        const section =
            this.resolveSection(
                snapshot,
                "execution"
            ) ??
            {};

        if (
            section.available === false ||
            !section
        ) {

            ledger.missing.push(
                "Execution Engine"
            );

            return {
                available: false,
                passed: false,
                failedHard: false,
                entry: null,
                stop: null,
                targets: [],
                riskReward: null,
                reason:
                    section.reason ??
                    "Watchlist: Entry, stop and target are not yet defined."
            };

        }

        const data =
            section.data ??
            section;

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
                ...(
                    Array.isArray(data.targets)
                        ? data.targets
                        : []
                )
            ]
                .map(value =>
                    typeof value === "object"
                        ? this.firstFinite(
                            value.price,
                            value.level
                        )
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

            const risk =
                Math.abs(
                    entry - stop
                );

            const reward =
                Math.abs(
                    targets[0] -
                    entry
                );

            if (risk > 0) {
                riskReward =
                    reward / risk;
            }

        }

        const liquidityOk =
            data.liquiditySufficient !== false &&
            String(
                data.liquidity ??
                ""
            ).toUpperCase() !==
            "INSUFFICIENT";

        const tapCount =
            this.firstFinite(
                data.nodeTaps,
                data.tapCount,
                data.tests
            );

        const tapsOk =
            !Number.isFinite(tapCount) ||
            tapCount <=
            this.config.maxNodeTaps;

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
            riskReward >=
            this.config.minimumRiskReward;

        const failedHard =
            data.invalid === true ||
            !liquidityOk ||
            (
                Number.isFinite(
                    riskReward
                ) &&
                riskReward <
                this.config.minimumRiskReward
            );

        const passed =
            geometryValid &&
            rrPassed &&
            liquidityOk &&
            tapsOk;

        const reason =
            passed
                ? "Execution gate passed."
                : this.executionFailureReason({
                    geometryValid,
                    rrPassed,
                    liquidityOk,
                    tapsOk
                });

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
                    reason,
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
            tapCount:
                Number.isFinite(tapCount)
                    ? tapCount
                    : null,
            tapsOk,
            reason
        };

    }

    score(parts) {

        let score = 0;

        score +=
            Math.min(
                3,
                Math.max(
                    1,
                    parts.pattern.quality
                )
            );

        score +=
            parts.structure.alignment;

        score +=
            parts.evolution.alignment;

        score +=
            parts.relativeStrength.alignment;

        score +=
            parts.optionsFlow.alignment;

        score +=
            parts.darkPools.alignment;

        if (
            parts.execution.riskReward >=
            this.config.preferredRiskReward
        ) {
            score += 1;
        }

        const optionalAvailable =
            [
                parts.evolution,
                parts.relativeStrength,
                parts.optionsFlow,
                parts.darkPools
            ]
                .filter(item =>
                    item.available
                )
                .length;

        const conflicts =
            [
                parts.structure,
                parts.evolution,
                parts.relativeStrength,
                parts.optionsFlow,
                parts.darkPools
            ]
                .filter(item =>
                    item.alignment < 0
                )
                .length;

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

        /*
         * Hunter RS rule:
         * Mediocre or conflicting RS can never produce A+.
         */
        if (
            grade === "A+" &&
            parts.relativeStrength.available &&
            parts.relativeStrength.alignment <= 0
        ) {
            grade = "A";
        }

        const confidence =
            grade === "A+" ||
            grade === "A"
                ? "HIGH"
                : "MEDIUM";

        return {
            grade,
            confidence,
            score:
                Number(
                    score.toFixed(2)
                ),
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
        identity,
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
            ledger.gates.pattern?.name ??
            null;

        const primaryNode =
            ledger.gates.location
                ?.primaryNode ??
            null;

        return {
            version:
                this.version,

            symbol:
                identity.symbol,

            spot:
                identity.spot,

            status,
            grade,
            direction,
            confidence,
            score,
            positionSize,

            thesis:
                this.buildThesis({
                    grade,
                    direction,
                    primaryPattern,
                    primaryNode,
                    reason
                }),

            primaryPattern,
            primaryNode,

            execution: {
                entry:
                    execution?.entry ??
                    null,

                stop:
                    execution?.stop ??
                    null,

                targets:
                    execution?.targets ??
                    [],

                riskReward:
                    execution?.riskReward ??
                    null
            },

            gates:
                ledger.gates,

            supportingEvidence:
                ledger.supporting,

            conflictingEvidence:
                ledger.conflicting,

            missingEvidence:
                [
                    ...new Set(
                        ledger.missing
                    )
                ],

            explanation:
                this.buildExplanation({
                    grade,
                    direction,
                    reason,
                    ledger,
                    execution
                }),

            createdAt:
                new Date().toISOString()
        };

    }

    buildDataError(
        reason,
        snapshot = null
    ) {

        const identity =
            snapshot
                ? this.resolveIdentity(
                    snapshot
                )
                : {
                    symbol: null,
                    spot: null
                };

        return {
            version:
                this.version,

            symbol:
                identity.symbol,

            spot:
                identity.spot,

            status:
                "DATA_ERROR",

            grade:
                "PASS",

            direction:
                "NONE",

            confidence:
                "LOW",

            score:
                null,

            positionSize:
                "NONE",

            thesis:
                reason,

            primaryPattern:
                null,

            primaryNode:
                null,

            execution: {
                entry: null,
                stop: null,
                targets: [],
                riskReward: null
            },

            gates: {},

            supportingEvidence: [],

            conflictingEvidence: [
                this.evidenceItem(
                    "DATA",
                    reason
                )
            ],

            missingEvidence: [
                "Canonical Hunter evidence"
            ],

            explanation: {
                verdict:
                    `DATA_ERROR | ${reason}`,

                whyItWorks:
                    [],

                whatCouldInvalidate:
                    [reason],

                execution:
                    "Execution unavailable."
            },

            createdAt:
                new Date().toISOString()
        };

    }

    buildThesis({
        grade,
        direction,
        primaryPattern,
        primaryNode,
        reason
    }) {

        if (
            grade === "PASS" ||
            grade === "WATCHLIST"
        ) {
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

        return {
            verdict:
                `${grade} | ${direction} | ${reason}`,

            whyItWorks:
                ledger.supporting
                    .map(item =>
                        item.message
                    ),

            whatCouldInvalidate:
                ledger.conflicting
                    .map(item =>
                        item.message
                    ),

            execution:
                execution?.passed
                    ? (
                        `Entry ${execution.entry}, ` +
                        `stop ${execution.stop}, ` +
                        `target ${execution.targets[0]}, ` +
                        `${execution.riskReward.toFixed(2)}:1 reward/risk.`
                    )
                    : (
                        execution?.reason ??
                        "Execution is not yet available."
                    )
        };

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
            return (
                `Pass: Reward/risk is below ` +
                `${this.config.minimumRiskReward}:1.`
            );
        }

        return "Watchlist: Execution is incomplete.";

    }

    geometryMatchesDirection(
        direction,
        entry,
        stop,
        target
    ) {

        if (direction === "LONG") {
            return (
                stop < entry &&
                target > entry
            );
        }

        if (direction === "SHORT") {
            return (
                stop > entry &&
                target < entry
            );
        }

        return false;

    }

    normalizeDirection(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "NONE";
        }

        const text =
            typeof value === "string"
                ? value.toUpperCase()
                : JSON.stringify(value)
                    .toUpperCase();

        if (
            this.containsAny(
                text,
                [
                    "LONG",
                    "BULLISH",
                    "UPSIDE",
                    "BUY",
                    "FLOOR",
                    "SUPPORT"
                ]
            )
        ) {
            return "LONG";
        }

        if (
            this.containsAny(
                text,
                [
                    "SHORT",
                    "BEARISH",
                    "DOWNSIDE",
                    "SELL",
                    "CEILING",
                    "RESISTANCE"
                ]
            )
        ) {
            return "SHORT";
        }

        return "NONE";

    }

    evidenceItem(
        source,
        message,
        data = null
    ) {

        return {
            source,
            message,
            data
        };

    }

    containsAny(
        text,
        values
    ) {

        return values.some(
            value =>
                text.includes(value)
        );

    }

    numberOr(
        value,
        fallback
    ) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;

    }

    firstFinite(...values) {

        for (const value of values) {

            const number =
                Number(value);

            if (Number.isFinite(number)) {
                return number;
            }

        }

        return null;

    }

}

export default HunterDecisionEngine;