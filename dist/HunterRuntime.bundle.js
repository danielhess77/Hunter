(() => {
  // runtime/HunterMarketState.js
  var HunterMarketState = class {
    constructor() {
      this.symbol = null;
      this.spot = null;
      this.expirations = [];
      this.strikes = [];
      this.gamma = [];
      this.vanna = [];
      this.lastUpdated = null;
    }
    loadMatrix(matrix) {
      this.symbol = matrix.symbol;
      this.spot = matrix.CurrentSpot;
      this.expirations = matrix.Expirations || [];
      this.strikes = matrix.Strikes || [];
      this.gamma = matrix.GammaValues || [];
      this.vanna = matrix.VannaValues || [];
      this.lastUpdated = matrix.LastUpdated || null;
    }
  };
  var HunterMarketState_default = HunterMarketState;

  // connectors/HunterDataConnector/HunterDataConnector.js
  var HunterDataConnector = class {
    constructor() {
      this.version = "1.1";
    }
    connect(rawData, marketState) {
      console.log("Connecting Skylit data...");
      const matrixCall = this.findMatrixCall(rawData);
      if (!matrixCall) {
        throw new Error("No Heatseeker matrix payload found.");
      }
      marketState.loadMatrix(matrixCall.payload);
      return marketState;
    }
    findMatrixCall(rawData) {
      if (!rawData.fetchCalls) {
        return null;
      }
      return rawData.fetchCalls.find(
        (call) => call.type === "matrix" && call.payload
      );
    }
  };
  var HunterDataConnector_default = HunterDataConnector;

  // engines/InstitutionalMapEngine/NodeClassifier.js
  var NodeClassifier = class {
    classify(node, context = {}) {
      const magnitude = node.magnitude ?? 0;
      const largestMagnitude = context.largestMagnitude ?? 0;
      const isKingNode = magnitude === largestMagnitude && magnitude > 0;
      const isFloor = false;
      const isCeiling = false;
      const isGatekeeper = false;
      let type = "Unknown";
      if (isKingNode)
        type = "King Node";
      else if (isFloor)
        type = "Floor";
      else if (isCeiling)
        type = "Ceiling";
      else if (isGatekeeper)
        type = "Gatekeeper";
      return {
        // Preserve everything from MatrixParser
        ...node,
        // Add Hunter classifications
        type,
        isKingNode,
        isFloor,
        isCeiling,
        isGatekeeper
      };
    }
  };
  var NodeClassifier_default = NodeClassifier;

  // engines/InstitutionalMapEngine/MatrixParser.js
  var MatrixParser = class {
    parse(marketState) {
      const nodes = [];
      const strikes = marketState.strikes || [];
      const gamma = marketState.gamma || [];
      const vanna = marketState.vanna || [];
      for (let strikeIndex = 0; strikeIndex < strikes.length; strikeIndex++) {
        const strike = strikes[strikeIndex];
        const gammaRow = gamma[strikeIndex] || [];
        const vannaRow = vanna[strikeIndex] || [];
        const gammaMagnitude = gammaRow.reduce(
          (sum, value) => sum + Math.abs(value || 0),
          0
        );
        const vannaMagnitude = vannaRow.reduce(
          (sum, value) => sum + Math.abs(value || 0),
          0
        );
        nodes.push({
          strike,
          gamma: gammaRow,
          vanna: vannaRow,
          gammaMagnitude,
          vannaMagnitude
        });
      }
      return nodes;
    }
  };
  var MatrixParser_default = MatrixParser;

  // engines/InstitutionalMapEngine/InstitutionalMapEngine.js
  var InstitutionalMapEngine = class {
    constructor() {
      this.name = "Institutional Map Engine";
      this.matrixParser = new MatrixParser_default();
      this.nodeClassifier = new NodeClassifier_default();
    }
    analyze(marketState) {
      const nodes = this.matrixParser.parse(marketState);
      const largestMagnitude = Math.max(
        ...nodes.map(
          (node) => Math.abs(node.magnitude)
        ),
        0
      );
      return nodes.map(
        (node) => this.nodeClassifier.classify(node, {
          largestMagnitude
        })
      );
    }
  };
  var InstitutionalMapEngine_default = InstitutionalMapEngine;

  // engines/InstitutionalStructureEngine/StructureStateAnalyzer.js
  var StructureStateAnalyzer = class {
    analyze(nodes, spot) {
      return nodes.map((node) => ({
        ...node,
        distance: node.strike - spot,
        absDistance: Math.abs(node.strike - spot),
        aboveSpot: node.strike > spot,
        belowSpot: node.strike < spot
      }));
    }
  };
  var StructureStateAnalyzer_default = StructureStateAnalyzer;

  // engines/InstitutionalStructureEngine/StructureEvaluator.js
  var StructureEvaluator = class {
    evaluate(structure) {
      return {
        bias: "Neutral",
        floor: structure.strongestNodeBelowSpot,
        ceiling: structure.strongestNodeAboveSpot,
        tradeZone: false,
        confidence: 0
      };
    }
  };
  var StructureEvaluator_default = StructureEvaluator;

  // engines/InstitutionalStructureEngine/InstitutionalStructureEngine.js
  var InstitutionalStructureEngine = class {
    constructor() {
      this.stateAnalyzer = new StructureStateAnalyzer_default();
      this.structureEvaluator = new StructureEvaluator_default();
    }
    analyze(nodes = [], currentPrice = null, previousNodes = []) {
      const stateNodes = this.stateAnalyzer.analyze(
        nodes,
        currentPrice,
        previousNodes
      );
      let nearestNode = null;
      let nearestDistance = Number.MAX_VALUE;
      if (currentPrice !== null) {
        stateNodes.forEach((node) => {
          const distance = Math.abs(node.strike - currentPrice);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestNode = node;
          }
        });
      }
      const nearbyNodes = stateNodes.filter(
        (node) => currentPrice !== null && Math.abs(node.strike - currentPrice) <= 2
      );
      const kingGammaNode = [...stateNodes].sort(
        (a, b) => b.gammaMagnitude - a.gammaMagnitude
      )[0] || null;
      const kingVannaNode = [...stateNodes].sort(
        (a, b) => b.vannaMagnitude - a.vannaMagnitude
      )[0] || null;
      const strongestNodeAboveSpot = stateNodes.filter(
        (node) => currentPrice !== null && node.strike > currentPrice
      ).sort(
        (a, b) => b.gammaMagnitude - a.gammaMagnitude
      )[0] || null;
      const strongestNodeBelowSpot = stateNodes.filter(
        (node) => currentPrice !== null && node.strike < currentPrice
      ).sort(
        (a, b) => b.gammaMagnitude - a.gammaMagnitude
      )[0] || null;
      const floors = stateNodes.filter((node) => node.isFloor);
      const ceilings = stateNodes.filter((node) => node.isCeiling);
      const gatekeepers = stateNodes.filter((node) => node.isGatekeeper);
      const nearestFloor = [...floors].sort((a, b) => a.absDistance - b.absDistance)[0] || null;
      const nearestCeiling = [...ceilings].sort((a, b) => a.absDistance - b.absDistance)[0] || null;
      const nearestGatekeeper = [...gatekeepers].sort((a, b) => a.absDistance - b.absDistance)[0] || null;
      const structure = {
        nodes: stateNodes,
        kingNode: kingGammaNode,
        kingGammaNode,
        kingVannaNode,
        strongestNodeAboveSpot,
        strongestNodeBelowSpot,
        nearestFloor,
        nearestCeiling,
        nearestGatekeeper,
        floors,
        ceilings,
        gatekeepers,
        nearestNode,
        nearestDistance,
        nearbyNodes
      };
      structure.evaluation = this.structureEvaluator.evaluate(structure);
      return structure;
    }
  };
  var InstitutionalStructureEngine_default = InstitutionalStructureEngine;

  // engines/HunterDecisionEngine/HunterDecisionEngine.js
  var HunterDecisionEngine = class {
    analyze(structure) {
      let score = 0;
      const reasons = [];
      if (structure.strongestNodeBelowSpot && structure.nearestDistance <= 2) {
        score += 30;
        reasons.push(
          "Price is near institutional demand."
        );
      }
      if (structure.strongestNodeAboveSpot && structure.strongestNodeAboveSpot.strike > structure.nearestNode.strike) {
        score += 10;
        reasons.push(
          "Upside liquidity available."
        );
      }
      if (structure.kingGammaNode && Math.abs(
        structure.kingGammaNode.strike - structure.nearestNode.strike
      ) <= 2) {
        score += 20;
        reasons.push(
          "Trading near King Gamma."
        );
      }
      if (structure.nearbyNodes.length >= 3) {
        score += 15;
        reasons.push(
          "Multiple institutional nodes nearby."
        );
      }
      let grade = "Pass";
      if (score >= 70)
        grade = "A";
      else if (score >= 50)
        grade = "B";
      else if (score >= 30)
        grade = "Watch";
      return {
        score,
        grade,
        reasons
      };
    }
  };
  var HunterDecisionEngine_default = HunterDecisionEngine;

  // engines/HunterPatternEngine/HunterPatternEngine.js
  var HunterPatternEngine = class {
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
      const nearbyMajorNodes = majorNodes.map((node) => ({
        ...node,
        distanceFromSpot: spot !== null ? Math.abs(node.strike - spot) : null
      })).filter(
        (node) => node.distanceFromSpot !== null && node.distanceFromSpot <= 2
      ).sort(
        (a, b) => a.distanceFromSpot - b.distanceFromSpot
      );
      const primaryNode = nearbyMajorNodes[0] || null;
      const locationEligible = primaryNode !== null;
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
          reason: "Price is not within two strikes of a major institutional node. Hunter does not trade midpoints.",
          requiredData
        };
      }
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
            direction: primaryNode.strike < spot ? "BULLISH_DEFLECTION_WATCH" : primaryNode.strike > spot ? "BEARISH_DEFLECTION_WATCH" : "PIVOT_WATCH",
            nodeStrike: primaryNode.strike,
            nodeRole: primaryNode.role,
            distanceFromSpot: primaryNode.distanceFromSpot,
            reason: "Price is near a major institutional node. Confirmation requires price response data."
          }
        ],
        reason: "Price is within two strikes of a major institutional node. Pattern evaluation is permitted.",
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
      const uniqueNodes = /* @__PURE__ */ new Map();
      for (const candidate of candidates) {
        const node = candidate.node;
        if (!node || typeof node.strike !== "number") {
          continue;
        }
        const existing = uniqueNodes.get(node.strike);
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
  };
  var HunterPatternEngine_default = HunterPatternEngine;

  // runtime/HunterRuntime.js
  var HunterRuntime = class {
    constructor() {
      this.dataConnector = new HunterDataConnector_default();
      this.marketState = new HunterMarketState_default();
      this.mapEngine = new InstitutionalMapEngine_default();
      this.structureEngine = new InstitutionalStructureEngine_default();
      this.patternEngine = new HunterPatternEngine_default();
      this.decisionEngine = new HunterDecisionEngine_default();
    }
    analyze(rawData) {
      this.dataConnector.connect(
        rawData,
        this.marketState
      );
      const nodes = this.mapEngine.analyze(
        this.marketState
      );
      const structure = this.structureEngine.analyze(
        nodes,
        this.marketState.spot
      );
      const patterns = this.patternEngine.analyze(
        this.marketState,
        structure
      );
      const decision = this.decisionEngine.analyze(
        structure
      );
      return {
        marketState: this.marketState,
        nodes,
        structure,
        patterns,
        decision
      };
    }
  };
  var HunterRuntime_default = HunterRuntime;
})();
