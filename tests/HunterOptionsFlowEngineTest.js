/**
 * Hunter Options Flow Engine Test
 * Version: 1.0.0
 */

import assert from "node:assert/strict";

import HunterOptionsFlowEngine
    from "../engines/HunterOptionsFlowEngine/HunterOptionsFlowEngine.js";

const engine = new HunterOptionsFlowEngine();

const now = "2026-07-16T14:30:00Z";

const records = [
    {
        id: "call-1",
        symbol: "NVDA",
        timestamp: "2026-07-16T14:26:00Z",
        optionType: "CALL",
        side: "BUY",
        premium: 1200000,
        contracts: 800,
        strike: 180,
        expiration: "2026-09-18",
        openClose: "OPENING",
        isSweep: true,
        price: 15,
        ask: 15,
        bid: 14.8
    },
    {
        id: "call-2",
        symbol: "NVDA",
        timestamp: "2026-07-16T14:18:00Z",
        optionType: "CALL",
        side: "BUY",
        premium: 850000,
        contracts: 600,
        strike: 180,
        expiration: "2026-09-18",
        openClose: "OPENING",
        isSweep: true,
        price: 14.2,
        ask: 14.2,
        bid: 14
    },
    {
        id: "call-3",
        symbol: "NVDA",
        timestamp: "2026-07-16T14:03:00Z",
        optionType: "CALL",
        side: "BUY",
        premium: 650000,
        contracts: 500,
        strike: 182.5,
        expiration: "2026-09-18",
        openClose: "PROBABLY_OPENING",
        isSweep: true
    },
    {
        id: "call-4",
        symbol: "NVDA",
        timestamp: "2026-07-16T13:48:00Z",
        optionType: "CALL",
        side: "BUY",
        premium: 500000,
        contracts: 400,
        strike: 180,
        expiration: "2026-09-18",
        openClose: "OPENING"
    },
    {
        id: "put-1",
        symbol: "NVDA",
        timestamp: "2026-07-16T14:20:00Z",
        optionType: "PUT",
        side: "BUY",
        premium: 100000,
        contracts: 100,
        strike: 165,
        expiration: "2026-08-21",
        openClose: "UNKNOWN"
    },
    {
        id: "spread-1",
        symbol: "NVDA",
        timestamp: "2026-07-16T14:25:00Z",
        optionType: "CALL",
        side: "BUY",
        premium: 5000000,
        contracts: 2000,
        strike: 185,
        expiration: "2026-09-18",
        strategy: "CALL SPREAD",
        isMultiLeg: true
    }
];

const result = engine.analyze(
    records,
    {
        symbol: "NVDA",
        spot: 179.5,
        mode: "SWING",
        now,
        nodes: [
            {
                strike: 180,
                role: "FLOOR"
            },
            {
                strike: 190,
                role: "CEILING"
            }
        ]
    }
);

assert.equal(result.available, true);
assert.equal(result.bias, "BULLISH");
assert.equal(result.direction, "LONG");
assert.equal(result.ignoredMultiLegCount, 1);
assert.equal(result.qualifyingDirectionalRecords, 5);
assert.ok(result.convictionScore > 0);
assert.ok(
    ["A", "B", "C", "D", "F"]
        .includes(result.grade)
);
assert.equal(
    result.largestTrade.id,
    "call-1"
);
assert.equal(
    result.dominantStrike,
    180
);

const onlyMultiLeg = engine.analyze([
    {
        optionType: "CALL",
        side: "BUY",
        premium: 10000000,
        isMultiLeg: true,
        strategy: "VERTICAL"
    }
]);

assert.equal(onlyMultiLeg.available, false);
assert.equal(
    onlyMultiLeg.ignoredMultiLegCount,
    1
);

const bearish = engine.analyze([
    {
        timestamp: now,
        optionType: "PUT",
        side: "BUY",
        premium: 1000000,
        strike: 100,
        expiration: "2026-09-18",
        openClose: "OPENING",
        isSweep: true
    }
], {
    now,
    nodes: [
        {
            strike: 100,
            role: "CEILING"
        }
    ]
});

assert.equal(bearish.bias, "BEARISH");
assert.equal(bearish.direction, "SHORT");

console.log("Hunter Options Flow Engine Test: PASS");
console.log(JSON.stringify(result, null, 2));