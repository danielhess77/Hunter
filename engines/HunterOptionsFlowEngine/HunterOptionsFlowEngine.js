/**
 * Hunter Options Flow Engine
 * Version: 1.1.0
 *
 * Purpose:
 * - Convert normalized directional options transactions into
 *   contextual confirmation evidence for Hunter.
 * - Ignore all multi-leg flow.
 * - Never create a trade thesis by itself.
 *
 * Expected input:
 * analyze(flowRecords, context)
 *
 * flowRecords may be:
 * - an array of normalized option trades, or
 * - an object containing records under one of:
 *   records, trades, flow, optionsFlow, data
 *
 * Context may contain:
 * - symbol
 * - spot
 * - nodes
 * - structure
 * - patterns
 * - mode: "SWING" | "0DTE"
 * - now
 */

class HunterOptionsFlowEngine {

    constructor(config = {}) {

        this.version = "1.1.0";

        this.config = {
            minimumUsableRecords: 1,
            minimumDirectionalPremium: 25000,
            sweepClusterWindowMinutes: 20,
            persistenceWindowMinutes: 60,
            recentWindowMinutes: 15,
            maxRecordsReturned: 25,
            nearNodeStrikeDistance: 2,
            mixedThreshold: 0.18,
            ...config
        };

    }

    analyze(flowInput, context = {}) {

        const rawRecords = this.extractRecords(flowInput);

        if (rawRecords.length === 0) {
            return this.unavailable(
                "No options-flow records were supplied."
            );
        }

        const normalized = rawRecords
            .map((record, index) =>
                this.normalizeRecord(record, index, context)
            )
            .filter(Boolean);

        const multiLegRecords =
            normalized.filter(record => record.isMultiLeg);

        const directionalRecords =
            normalized.filter(record =>
                !record.isMultiLeg &&
                record.direction !== "NEUTRAL" &&
                record.premium >=
                    this.config.minimumDirectionalPremium
            );

        if (
            directionalRecords.length <
            this.config.minimumUsableRecords
        ) {
            return {
                ...this.unavailable(
                    "No qualifying outright directional flow remained after filtering."
                ),
                totalRecords: normalized.length,
                ignoredMultiLegCount: multiLegRecords.length,
                ignoredMultiLegPremium:
                    this.sum(multiLegRecords, "premium")
            };
        }

        const now =
            this.resolveNow(context.now, directionalRecords);

        const bullishRecords =
            directionalRecords.filter(
                record => record.direction === "BULLISH"
            );

        const bearishRecords =
            directionalRecords.filter(
                record => record.direction === "BEARISH"
            );

        const bullishPremium =
            this.sum(bullishRecords, "weightedPremium");

        const bearishPremium =
            this.sum(bearishRecords, "weightedPremium");

        const totalWeightedPremium =
            bullishPremium + bearishPremium;

        const netDirectionalPremium =
            bullishPremium - bearishPremium;

        const institutionalConsensus =
            this.calculateInstitutionalConsensus(
                bullishPremium,
                bearishPremium
            );

        const bias =
            this.classifyBias(
                bullishPremium,
                bearishPremium,
                totalWeightedPremium
            );

        const opening =
            this.scoreOpeningInterest(directionalRecords);

        const sweeps =
            this.scoreSweeps(directionalRecords, now);

        const premium =
            this.scorePremium(
                directionalRecords,
                totalWeightedPremium
            );

        const persistence =
            this.scorePersistence(
                directionalRecords,
                bias,
                now
            );

        const expiration =
            this.scoreExpiration(
                directionalRecords,
                context.mode
            );

        const strikeAlignment =
            this.scoreStrikeAlignment(
                directionalRecords,
                bias,
                context
            );

        const unusual =
            this.scoreUnusualActivity(
                directionalRecords
            );

        const conviction =
            this.calculateConviction({
                bias,
                opening,
                sweeps,
                premium,
                persistence,
                expiration,
                strikeAlignment,
                unusual,
                bullishPremium,
                bearishPremium,
                totalWeightedPremium
            });

        const dominantRecords =
            bias === "BULLISH"
                ? bullishRecords
                : bias === "BEARISH"
                    ? bearishRecords
                    : directionalRecords;

        const largestTrade =
            [...directionalRecords]
                .sort((a, b) => b.premium - a.premium)[0] ??
            null;

        const dominantExpiration =
            this.modeValue(
                dominantRecords
                    .map(record => record.expiration)
                    .filter(Boolean)
            );

        const dominantStrike =
            this.weightedModeStrike(dominantRecords);

        const supportingEvidence =
            this.buildSupportingEvidence({
                bias,
                opening,
                sweeps,
                premium,
                persistence,
                expiration,
                strikeAlignment,
                unusual
            });

        const conflictingEvidence =
            this.buildConflictingEvidence({
                bias,
                bullishPremium,
                bearishPremium,
                opening,
                persistence,
                strikeAlignment
            });

        const direction =
            bias === "BULLISH"
                ? "LONG"
                : bias === "BEARISH"
                    ? "SHORT"
                    : "NONE";

        return {
            version: this.version,
            available: true,
            engine: "HunterOptionsFlowEngine",
            status:
                bias === "NEUTRAL"
                    ? "NEUTRAL"
                    : bias === "MIXED"
                        ? "MIXED"
                        : "CONFIRMATION_AVAILABLE",

            // Fields used directly by HunterDecisionEngine.
            direction,
            bias,
            signal: direction,
            grade: conviction.grade,
            confidence: conviction.confidence,
            convictionScore: conviction.score,
            institutionalConsensus,

            // Core totals.
            totalRecords: normalized.length,
            qualifyingDirectionalRecords:
                directionalRecords.length,
            ignoredMultiLegCount: multiLegRecords.length,
            ignoredMultiLegPremium:
                this.round(
                    this.sum(multiLegRecords, "premium")
                ),

            bullishRecordCount: bullishRecords.length,
            bearishRecordCount: bearishRecords.length,
            bullishPremium:
                this.round(
                    this.sum(bullishRecords, "premium")
                ),
            bearishPremium:
                this.round(
                    this.sum(bearishRecords, "premium")
                ),
            weightedBullishPremium:
                this.round(bullishPremium),
            weightedBearishPremium:
                this.round(bearishPremium),
            netDirectionalPremium:
                this.round(netDirectionalPremium),

            // Component analysis.
            components: {
                openingInterest: opening,
                sweeps,
                premium,
                persistence,
                expiration,
                strikeAlignment,
                unusualActivity: unusual
            },

            largestTrade:
                largestTrade
                    ? this.publicRecord(largestTrade)
                    : null,

            dominantExpiration,
            dominantStrike,

            supportingEvidence,
            conflictingEvidence,

            reason:
                this.buildReason(
                    bias,
                    conviction,
                    directionalRecords.length,
                    multiLegRecords.length
                ),

            recentDirectionalRecords:
                directionalRecords
                    .sort(
                        (a, b) =>
                            (b.timestampMs ?? 0) -
                            (a.timestampMs ?? 0)
                    )
                    .slice(
                        0,
                        this.config.maxRecordsReturned
                    )
                    .map(record =>
                        this.publicRecord(record)
                    ),

            createdAt: new Date().toISOString()
        };

    }

    extractRecords(input) {

        if (Array.isArray(input)) return input;

        if (!input || typeof input !== "object") {
            return [];
        }

        const candidates = [
            input.records,
            input.trades,
            input.flow,
            input.optionsFlow,
            input.data,
            input.results,
            input.items
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }
        }

        return [];

    }

    normalizeRecord(record, index, context) {

        if (!record || typeof record !== "object") {
            return null;
        }

        const optionType =
            this.normalizeOptionType(
                this.firstDefined(
                    record.optionType,
                    record.type,
                    record.right,
                    record.callPut,
                    record.putCall,
                    record.cp
                )
            );

        const side =
            this.normalizeSide(record);

        const isMultiLeg =
            this.detectMultiLeg(record);

        const premium =
            this.firstFinite(
                record.premium,
                record.totalPremium,
                record.notional,
                record.value,
                record.cost,
                record.tradeValue,
                record.price &&
                record.contracts
                    ? Number(record.price) *
                      Number(record.contracts) *
                      100
                    : null
            ) ?? 0;

        const contracts =
            this.firstFinite(
                record.contracts,
                record.size,
                record.quantity,
                record.qty,
                record.volume
            ) ?? 0;

        const strike =
            this.firstFinite(
                record.strike,
                record.strikePrice,
                record.k
            );

        const timestamp =
            this.firstDefined(
                record.timestamp,
                record.time,
                record.tradeTime,
                record.createdAt,
                record.executedAt,
                record.t
            );

        const timestampMs =
            this.toTimestampMs(timestamp);

        const expiration =
            this.normalizeExpiration(
                this.firstDefined(
                    record.expiration,
                    record.expiry,
                    record.expDate,
                    record.expirationDate,
                    record.dteExpiration
                )
            );

        const dte =
            this.resolveDte(
                record.dte,
                expiration,
                timestampMs
            );

        const openingState =
            this.normalizeOpeningState(record);

        const isSweep =
            this.detectSweep(record);

        const direction =
            this.classifyDirection(
                optionType,
                side,
                record
            );

        const executionQuality =
            this.executionQuality(record, side);

        const weightedPremium =
            premium *
            this.openingMultiplier(openingState) *
            this.executionMultiplier(executionQuality) *
            this.expirationMultiplier(dte, context.mode);

        return {
            id:
                this.firstDefined(
                    record.id,
                    record.tradeId,
                    record.orderId,
                    record.alertId
                ) ?? `flow-${index}`,

            symbol:
                this.firstDefined(
                    record.symbol,
                    record.ticker,
                    record.underlying,
                    context.symbol
                ) ?? null,

            optionType,
            side,
            direction,
            isMultiLeg,
            isSweep,
            openingState,
            executionQuality,
            premium,
            weightedPremium,
            contracts,
            strike,
            expiration,
            dte,
            timestamp,
            timestampMs,
            exchange:
                this.firstDefined(
                    record.exchange,
                    record.venue,
                    record.market
                ) ?? null,
            underlyingPrice:
                this.firstFinite(
                    record.underlyingPrice,
                    record.spot,
                    record.stockPrice,
                    context.spot
                ),
            openInterest:
                this.firstFinite(
                    record.openInterest,
                    record.oi
                ),
            volume:
                this.firstFinite(
                    record.volume,
                    record.contractVolume
                ),
            raw: record
        };

    }

    classifyDirection(optionType, side, record) {

        const explicit =
            String(
                this.firstDefined(
                    record.direction,
                    record.bias,
                    record.sentiment
                ) ?? ""
            ).toUpperCase();

        if (
            ["BULLISH", "LONG", "BUY"].includes(explicit)
        ) {
            return "BULLISH";
        }

        if (
            ["BEARISH", "SHORT", "SELL"].includes(explicit)
        ) {
            return "BEARISH";
        }

        if (optionType === "CALL") {
            if (side === "BUY") return "BULLISH";
            if (side === "SELL") return "BEARISH";
        }

        if (optionType === "PUT") {
            if (side === "BUY") return "BEARISH";
            if (side === "SELL") return "BULLISH";
        }

        return "NEUTRAL";

    }

    normalizeSide(record) {

        const explicit =
            String(
                this.firstDefined(
                    record.side,
                    record.action,
                    record.tradeSide,
                    record.buySell
                ) ?? ""
            ).toUpperCase();

        if (
            explicit.includes("BUY") ||
            explicit === "B" ||
            explicit.includes("ASK")
        ) {
            return "BUY";
        }

        if (
            explicit.includes("SELL") ||
            explicit === "S" ||
            explicit.includes("BID")
        ) {
            return "SELL";
        }

        const price =
            this.firstFinite(
                record.price,
                record.fillPrice,
                record.tradePrice
            );

        const bid =
            this.firstFinite(
                record.bid,
                record.bidPrice
            );

        const ask =
            this.firstFinite(
                record.ask,
                record.askPrice
            );

        if (
            Number.isFinite(price) &&
            Number.isFinite(ask) &&
            price >= ask
        ) {
            return "BUY";
        }

        if (
            Number.isFinite(price) &&
            Number.isFinite(bid) &&
            price <= bid
        ) {
            return "SELL";
        }

        return "UNKNOWN";

    }

    normalizeOptionType(value) {

        const text = String(value ?? "").toUpperCase();

        if (
            text === "C" ||
            text.includes("CALL")
        ) {
            return "CALL";
        }

        if (
            text === "P" ||
            text.includes("PUT")
        ) {
            return "PUT";
        }

        return "UNKNOWN";

    }

    normalizeOpeningState(record) {

        const text =
            String(
                this.firstDefined(
                    record.openClose,
                    record.positionEffect,
                    record.openingClosing,
                    record.intent
                ) ?? ""
            ).toUpperCase();

        if (
            record.isOpening === true ||
            text.includes("OPEN")
        ) {
            return "OPENING";
        }

        if (
            record.isClosing === true ||
            text.includes("CLOSE")
        ) {
            return "CLOSING";
        }

        const contracts =
            this.firstFinite(
                record.contracts,
                record.size,
                record.quantity,
                record.volume
            );

        const openInterest =
            this.firstFinite(
                record.openInterest,
                record.oi
            );

        if (
            Number.isFinite(contracts) &&
            Number.isFinite(openInterest) &&
            contracts > openInterest
        ) {
            return "PROBABLY_OPENING";
        }

        return "UNKNOWN";
    }

    detectMultiLeg(record) {

        if (
            record.isMultiLeg === true ||
            record.multiLeg === true ||
            record.isSpread === true ||
            record.spread === true
        ) {
            return true;
        }

        const legCount =
            this.firstFinite(
                record.legCount,
                record.legs?.length,
                record.numberOfLegs
            );

        if (
            Number.isFinite(legCount) &&
            legCount > 1
        ) {
            return true;
        }

        const text =
            JSON.stringify({
                strategy: record.strategy,
                tradeType: record.tradeType,
                condition: record.condition,
                description: record.description
            }).toUpperCase();

        return this.containsAny(text, [
            "MULTI-LEG",
            "MULTILEG",
            "VERTICAL",
            "CALENDAR",
            "DIAGONAL",
            "BUTTERFLY",
            "CONDOR",
            "IRON CONDOR",
            "RATIO SPREAD",
            "CALL SPREAD",
            "PUT SPREAD",
            "COLLAR",
            "COVERED CALL",
            "STRADDLE",
            "STRANGLE",
            "COMBO",
            "COMBINATION"
        ]);
    }

    detectSweep(record) {

        if (
            record.isSweep === true ||
            record.sweep === true
        ) {
            return true;
        }

        const text =
            String(
                this.firstDefined(
                    record.tradeType,
                    record.condition,
                    record.executionType,
                    record.label
                ) ?? ""
            ).toUpperCase();

        return text.includes("SWEEP");
    }

    executionQuality(record, side) {

        const price =
            this.firstFinite(
                record.price,
                record.fillPrice,
                record.tradePrice
            );

        const bid =
            this.firstFinite(
                record.bid,
                record.bidPrice
            );

        const ask =
            this.firstFinite(
                record.ask,
                record.askPrice
            );

        if (
            side === "BUY" &&
            Number.isFinite(price) &&
            Number.isFinite(ask) &&
            price >= ask
        ) {
            return "AGGRESSIVE";
        }

        if (
            side === "SELL" &&
            Number.isFinite(price) &&
            Number.isFinite(bid) &&
            price <= bid
        ) {
            return "AGGRESSIVE";
        }

        if (side === "UNKNOWN") {
            return "UNKNOWN";
        }

        return "NORMAL";
    }

    scoreOpeningInterest(records) {

        const openingPremium =
            this.sum(
                records.filter(record =>
                    ["OPENING", "PROBABLY_OPENING"]
                        .includes(record.openingState)
                ),
                "premium"
            );

        const totalPremium =
            this.sum(records, "premium");

        const ratio =
            totalPremium > 0
                ? openingPremium / totalPremium
                : 0;

        const score =
            ratio >= 0.75
                ? 25
                : ratio >= 0.50
                    ? 18
                    : ratio >= 0.25
                        ? 10
                        : 4;

        return {
            score,
            openingPremium: this.round(openingPremium),
            openingPremiumRatio:
                this.round(ratio, 4),
            confirmedOpeningCount:
                records.filter(
                    record =>
                        record.openingState === "OPENING"
                ).length,
            probableOpeningCount:
                records.filter(
                    record =>
                        record.openingState ===
                        "PROBABLY_OPENING"
                ).length
        };
    }

    scoreSweeps(records, now) {

        const sweeps =
            records.filter(record => record.isSweep);

        const recentSweeps =
            sweeps.filter(record =>
                this.withinMinutes(
                    record.timestampMs,
                    now,
                    this.config.sweepClusterWindowMinutes
                )
            );

        const directionalCounts = {
            bullish:
                recentSweeps.filter(
                    record =>
                        record.direction === "BULLISH"
                ).length,
            bearish:
                recentSweeps.filter(
                    record =>
                        record.direction === "BEARISH"
                ).length
        };

        const clusterSize =
            Math.max(
                directionalCounts.bullish,
                directionalCounts.bearish
            );

        const score =
            clusterSize >= 5
                ? 20
                : clusterSize >= 3
                    ? 14
                    : clusterSize >= 2
                        ? 9
                        : clusterSize === 1
                            ? 5
                            : 0;

        return {
            score,
            sweepCount: sweeps.length,
            recentSweepCount: recentSweeps.length,
            clusterSize,
            dominantSweepDirection:
                directionalCounts.bullish >
                directionalCounts.bearish
                    ? "BULLISH"
                    : directionalCounts.bearish >
                      directionalCounts.bullish
                        ? "BEARISH"
                        : "NONE"
        };
    }

    scorePremium(records, totalWeightedPremium) {

        const largest =
            records.reduce(
                (max, record) =>
                    Math.max(max, record.premium),
                0
            );

        const score =
            totalWeightedPremium >= 10000000
                ? 20
                : totalWeightedPremium >= 5000000
                    ? 17
                    : totalWeightedPremium >= 1000000
                        ? 14
                        : totalWeightedPremium >= 500000
                            ? 10
                            : totalWeightedPremium >= 100000
                                ? 6
                                : 3;

        return {
            score,
            totalWeightedPremium:
                this.round(totalWeightedPremium),
            largestPremium: this.round(largest)
        };
    }

    scorePersistence(records, bias, now) {

        if (
            bias !== "BULLISH" &&
            bias !== "BEARISH"
        ) {
            return {
                score: 0,
                persistent: false,
                intervalCount: 0,
                recentCount: 0,
                hourlyCount: 0
            };
        }

        const aligned =
            records.filter(
                record => record.direction === bias
            );

        const recent =
            aligned.filter(record =>
                this.withinMinutes(
                    record.timestampMs,
                    now,
                    this.config.recentWindowMinutes
                )
            );

        const hourly =
            aligned.filter(record =>
                this.withinMinutes(
                    record.timestampMs,
                    now,
                    this.config.persistenceWindowMinutes
                )
            );

        const intervalCount =
            this.countActiveIntervals(
                hourly,
                now,
                15,
                this.config.persistenceWindowMinutes
            );

        const score =
            intervalCount >= 4 && hourly.length >= 8
                ? 25
                : intervalCount >= 3 && hourly.length >= 5
                    ? 18
                    : intervalCount >= 2 && hourly.length >= 3
                        ? 11
                        : recent.length >= 2
                            ? 7
                            : 3;

        return {
            score,
            persistent: score >= 11,
            intervalCount,
            recentCount: recent.length,
            hourlyCount: hourly.length
        };
    }

    scoreExpiration(records, mode = "SWING") {

        let weightedScore = 0;
        let premiumTotal = 0;

        for (const record of records) {

            const premium =
                Math.max(record.premium, 1);

            const dteScore =
                this.expirationQualityScore(
                    record.dte,
                    mode
                );

            weightedScore += dteScore * premium;
            premiumTotal += premium;
        }

        const average =
            premiumTotal > 0
                ? weightedScore / premiumTotal
                : 0;

        return {
            score: this.round(average, 2),
            mode: String(mode ?? "SWING").toUpperCase()
        };
    }

    scoreStrikeAlignment(records, bias, context) {

        const nodes =
            Array.isArray(context.nodes)
                ? context.nodes
                : [];

        if (
            nodes.length === 0 ||
            (bias !== "BULLISH" &&
             bias !== "BEARISH")
        ) {
            return {
                score: 0,
                available: false,
                alignedPremium: 0,
                alignedRecordCount: 0
            };
        }

        let alignedPremium = 0;
        let alignedRecordCount = 0;
        let totalPremium = 0;

        for (const record of records) {

            totalPremium += record.premium;

            if (!Number.isFinite(record.strike)) {
                continue;
            }

            const nearNode =
                nodes.find(node => {
                    const nodeStrike =
                        this.firstFinite(
                            node.strike,
                            node.price,
                            node.level
                        );

                    return (
                        Number.isFinite(nodeStrike) &&
                        Math.abs(
                            nodeStrike - record.strike
                        ) <=
                        this.config.nearNodeStrikeDistance
                    );
                });

            if (!nearNode) continue;

            const role =
                String(
                    this.firstDefined(
                        nearNode.role,
                        nearNode.type,
                        nearNode.classification
                    ) ?? ""
                ).toUpperCase();

            const aligned =
                bias === "BULLISH"
                    ? this.containsAny(role, [
                        "FLOOR",
                        "SUPPORT",
                        "KING",
                        "GATEKEEPER"
                    ])
                    : this.containsAny(role, [
                        "CEILING",
                        "RESISTANCE",
                        "KING",
                        "GATEKEEPER"
                    ]);

            if (aligned) {
                alignedPremium += record.premium;
                alignedRecordCount += 1;
            }
        }

        const ratio =
            totalPremium > 0
                ? alignedPremium / totalPremium
                : 0;

        const score =
            ratio >= 0.65
                ? 15
                : ratio >= 0.35
                    ? 10
                    : ratio > 0
                        ? 5
                        : 0;

        return {
            score,
            available: true,
            alignedPremium:
                this.round(alignedPremium),
            alignedPremiumRatio:
                this.round(ratio, 4),
            alignedRecordCount
        };
    }

    scoreUnusualActivity(records) {

        let unusualCount = 0;
        let extremeCount = 0;

        for (const record of records) {

            const volumeOiRatio =
                Number.isFinite(record.volume) &&
                Number.isFinite(record.openInterest) &&
                record.openInterest > 0
                    ? record.volume /
                      record.openInterest
                    : null;

            if (
                record.premium >= 1000000 ||
                (Number.isFinite(volumeOiRatio) &&
                 volumeOiRatio >= 2)
            ) {
                extremeCount += 1;
                continue;
            }

            if (
                record.premium >= 250000 ||
                (Number.isFinite(volumeOiRatio) &&
                 volumeOiRatio >= 1)
            ) {
                unusualCount += 1;
            }
        }

        const score =
            extremeCount >= 2
                ? 15
                : extremeCount === 1
                    ? 11
                    : unusualCount >= 3
                        ? 8
                        : unusualCount > 0
                            ? 4
                            : 0;

        return {
            score,
            unusualCount,
            extremeCount
        };
    }

    calculateConviction(parts) {

        if (
            parts.bias !== "BULLISH" &&
            parts.bias !== "BEARISH"
        ) {
            return {
                score: 0,
                grade: "F",
                confidence: "LOW"
            };
        }

        const directionalDominance =
            parts.totalWeightedPremium > 0
                ? Math.abs(
                    parts.bullishPremium -
                    parts.bearishPremium
                ) /
                parts.totalWeightedPremium
                : 0;

        const raw =
            parts.opening.score * 0.25 +
            parts.sweeps.score * 0.15 +
            parts.premium.score * 0.15 +
            parts.persistence.score * 0.20 +
            parts.expiration.score * 0.10 +
            parts.strikeAlignment.score * 0.10 +
            parts.unusual.score * 0.05;

        const maximum =
            25 * 0.25 +
            20 * 0.15 +
            20 * 0.15 +
            25 * 0.20 +
            20 * 0.10 +
            15 * 0.10 +
            15 * 0.05;

        let score =
            maximum > 0
                ? (raw / maximum) * 100
                : 0;

        score *=
            0.60 +
            Math.min(0.40, directionalDominance);

        score =
            Math.max(
                0,
                Math.min(100, Math.round(score))
            );

        const grade =
            score >= 85
                ? "A"
                : score >= 70
                    ? "B"
                    : score >= 55
                        ? "C"
                        : score >= 40
                            ? "D"
                            : "F";

        const confidence =
            score >= 75
                ? "HIGH"
                : score >= 55
                    ? "MEDIUM"
                    : "LOW";

        return {
            score,
            grade,
            confidence,
            directionalDominance:
                this.round(directionalDominance, 4)
        };
    }

    calculateInstitutionalConsensus(
        bullishPremium,
        bearishPremium
    ) {

        const total =
            bullishPremium + bearishPremium;

        if (total <= 0) return 0;

        const dominantPremium =
            Math.max(
                bullishPremium,
                bearishPremium
            );

        return Math.round(
            (dominantPremium / total) * 100
        );
    }

    classifyBias(
        bullishPremium,
        bearishPremium,
        total
    ) {

        if (total <= 0) return "NEUTRAL";

        const difference =
            Math.abs(
                bullishPremium - bearishPremium
            );

        const differenceRatio =
            difference / total;

        if (
            differenceRatio <
            this.config.mixedThreshold
        ) {
            return "MIXED";
        }

        return bullishPremium > bearishPremium
            ? "BULLISH"
            : "BEARISH";
    }

    buildSupportingEvidence(parts) {

        const evidence = [];

        if (
            parts.bias === "BULLISH" ||
            parts.bias === "BEARISH"
        ) {
            evidence.push(
                `${parts.bias.toLowerCase()} outright directional premium dominates.`
            );
        }

        if (parts.opening.score >= 18) {
            evidence.push(
                "A large share of qualifying premium appears to be opening activity."
            );
        }

        if (parts.sweeps.score >= 9) {
            evidence.push(
                `${parts.sweeps.clusterSize} aligned sweeps formed a recent cluster.`
            );
        }

        if (parts.persistence.persistent) {
            evidence.push(
                "Directional flow persisted across multiple time intervals."
            );
        }

        if (parts.strikeAlignment.score >= 10) {
            evidence.push(
                "Flow is materially aligned with major institutional strikes."
            );
        }

        if (parts.unusual.score >= 8) {
            evidence.push(
                "Unusual or extreme directional activity is present."
            );
        }

        return evidence;
    }

    buildConflictingEvidence(parts) {

        const evidence = [];

        if (parts.bias === "MIXED") {
            evidence.push(
                "Bullish and bearish directional premium are too balanced for a clean confirmation."
            );
        }

        if (
            parts.opening.openingPremiumRatio < 0.25
        ) {
            evidence.push(
                "Most qualifying flow cannot be confirmed as new opening interest."
            );
        }

        if (!parts.persistence.persistent) {
            evidence.push(
                "Flow is isolated rather than persistent."
            );
        }

        if (
            parts.strikeAlignment.available &&
            parts.strikeAlignment.score === 0
        ) {
            evidence.push(
                "Directional flow is not concentrated near Hunter's major institutional nodes."
            );
        }

        return evidence;
    }

    buildReason(
        bias,
        conviction,
        qualifyingCount,
        ignoredMultiLegCount
    ) {

        const ignoredText =
            ignoredMultiLegCount > 0
                ? ` ${ignoredMultiLegCount} multi-leg record(s) were intentionally ignored.`
                : "";

        if (bias === "MIXED") {
            return (
                `Mixed directional flow across ${qualifyingCount} qualifying outright trade(s).` +
                ignoredText
            );
        }

        if (bias === "NEUTRAL") {
            return (
                "No clean directional flow confirmation was identified." +
                ignoredText
            );
        }

        return (
            `${bias.charAt(0) +
              bias.slice(1).toLowerCase()} options-flow confirmation ` +
            `with ${conviction.score}/100 conviction and grade ${conviction.grade}.` +
            ignoredText
        );
    }

    unavailable(reason) {

        return {
            version: this.version,
            available: false,
            engine: "HunterOptionsFlowEngine",
            status: "INSUFFICIENT_DATA",
            direction: "NONE",
            bias: "INSUFFICIENT_DATA",
            signal: "NONE",
            grade: "F",
            confidence: "LOW",
            convictionScore: 0,
            institutionalConsensus: 0,
            totalRecords: 0,
            qualifyingDirectionalRecords: 0,
            ignoredMultiLegCount: 0,
            ignoredMultiLegPremium: 0,
            bullishRecordCount: 0,
            bearishRecordCount: 0,
            bullishPremium: 0,
            bearishPremium: 0,
            weightedBullishPremium: 0,
            weightedBearishPremium: 0,
            netDirectionalPremium: 0,
            components: {},
            largestTrade: null,
            dominantExpiration: null,
            dominantStrike: null,
            supportingEvidence: [],
            conflictingEvidence: [],
            reason,
            recentDirectionalRecords: [],
            createdAt: new Date().toISOString()
        };
    }

    publicRecord(record) {

        return {
            id: record.id,
            symbol: record.symbol,
            timestamp: record.timestamp,
            optionType: record.optionType,
            side: record.side,
            direction: record.direction,
            premium: this.round(record.premium),
            contracts: record.contracts,
            strike: record.strike,
            expiration: record.expiration,
            dte: record.dte,
            openingState: record.openingState,
            isSweep: record.isSweep,
            executionQuality:
                record.executionQuality,
            exchange: record.exchange
        };
    }

    openingMultiplier(state) {

        if (state === "OPENING") return 1.25;
        if (state === "PROBABLY_OPENING") return 1.15;
        if (state === "CLOSING") return 0.25;
        return 0.75;
    }

    executionMultiplier(quality) {

        if (quality === "AGGRESSIVE") return 1.15;
        if (quality === "UNKNOWN") return 0.85;
        return 1;
    }

    expirationMultiplier(dte, mode) {

        const score =
            this.expirationQualityScore(dte, mode);

        return 0.5 + score / 20;
    }

    expirationQualityScore(dte, mode = "SWING") {

        const normalizedMode =
            String(mode ?? "SWING").toUpperCase();

        if (!Number.isFinite(dte)) return 6;

        if (normalizedMode === "0DTE") {
            if (dte === 0) return 20;
            if (dte <= 7) return 12;
            if (dte <= 30) return 8;
            return 5;
        }

        if (dte >= 180) return 20;
        if (dte >= 90) return 17;
        if (dte >= 30) return 14;
        if (dte >= 7) return 8;
        if (dte >= 1) return 5;
        return 3;
    }

    countActiveIntervals(
        records,
        now,
        intervalMinutes,
        totalMinutes
    ) {

        const active = new Set();

        for (const record of records) {

            if (!Number.isFinite(record.timestampMs)) {
                continue;
            }

            const ageMinutes =
                (now - record.timestampMs) / 60000;

            if (
                ageMinutes < 0 ||
                ageMinutes > totalMinutes
            ) {
                continue;
            }

            active.add(
                Math.floor(
                    ageMinutes / intervalMinutes
                )
            );
        }

        return active.size;
    }

    weightedModeStrike(records) {

        const weights = new Map();

        for (const record of records) {

            if (!Number.isFinite(record.strike)) {
                continue;
            }

            weights.set(
                record.strike,
                (weights.get(record.strike) ?? 0) +
                record.premium
            );
        }

        let winner = null;
        let winnerWeight = -1;

        for (const [strike, weight] of weights) {
            if (weight > winnerWeight) {
                winner = strike;
                winnerWeight = weight;
            }
        }

        return winner;
    }

    modeValue(values) {

        const counts = new Map();

        for (const value of values) {
            counts.set(
                value,
                (counts.get(value) ?? 0) + 1
            );
        }

        let winner = null;
        let winnerCount = -1;

        for (const [value, count] of counts) {
            if (count > winnerCount) {
                winner = value;
                winnerCount = count;
            }
        }

        return winner;
    }

    resolveNow(value, records) {

        const explicit = this.toTimestampMs(value);

        if (Number.isFinite(explicit)) {
            return explicit;
        }

        const latest =
            Math.max(
                ...records
                    .map(record => record.timestampMs)
                    .filter(Number.isFinite)
            );

        return Number.isFinite(latest)
            ? latest
            : Date.now();
    }

    withinMinutes(timestampMs, now, minutes) {

        if (
            !Number.isFinite(timestampMs) ||
            !Number.isFinite(now)
        ) {
            return false;
        }

        const age = now - timestampMs;

        return (
            age >= 0 &&
            age <= minutes * 60000
        );
    }

    resolveDte(value, expiration, timestampMs) {

        const explicit = Number(value);

        if (Number.isFinite(explicit)) {
            return explicit;
        }

        if (!expiration) return null;

        const expirationMs =
            Date.parse(`${expiration}T20:00:00Z`);

        const base =
            Number.isFinite(timestampMs)
                ? timestampMs
                : Date.now();

        if (!Number.isFinite(expirationMs)) {
            return null;
        }

        return Math.max(
            0,
            Math.ceil(
                (expirationMs - base) /
                86400000
            )
        );
    }

    normalizeExpiration(value) {

        if (!value) return null;

        const date = new Date(value);

        if (!Number.isFinite(date.getTime())) {
            return String(value);
        }

        return date.toISOString().slice(0, 10);
    }

    toTimestampMs(value) {

        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === "number") {
            return value < 100000000000
                ? value * 1000
                : value;
        }

        const parsed = Date.parse(value);

        return Number.isFinite(parsed)
            ? parsed
            : null;
    }

    sum(records, key) {

        return records.reduce(
            (total, record) =>
                total +
                (Number(record?.[key]) || 0),
            0
        );
    }

    firstFinite(...values) {

        for (const value of values) {
            const number = Number(value);
            if (Number.isFinite(number)) {
                return number;
            }
        }

        return null;
    }

    firstDefined(...values) {

        for (const value of values) {
            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                return value;
            }
        }

        return null;
    }

    containsAny(text, values) {

        return values.some(value =>
            text.includes(value)
        );
    }

    round(value, places = 2) {

        const factor = 10 ** places;

        return Math.round(
            (Number(value) || 0) * factor
        ) / factor;
    }

}

export default HunterOptionsFlowEngine;

 