# Hunter

**Hunter AI Engine for Skylit**

A modular, institutional-focused intelligence layer that runs live inside Skylit Heatseeker. Hunter intercepts gamma/heatmap matrix data, builds a rich institutional market structure model, detects sophisticated patterns around major nodes, and surfaces actionable insights directly in your workflow.

---

## What is Hunter?

Hunter is a client-side AI/trading intelligence system designed to augment professional traders using **Skylit Heatseeker**. 

Instead of just displaying raw gamma exposure, Hunter focuses on **institutional node behavior** — identifying King Gamma nodes, strongest nodes above/below spot, node migration, ceilings/floors, and high-probability pattern setups according to a disciplined rule system (the "Hunter Constitution").

The goal is to help traders quickly identify when price is interacting with significant institutional structure and what patterns are forming — all without leaving the Skylit interface.

---

## Core Philosophy

### The Hunter Constitution

Hunter follows strict rules to maintain focus and avoid low-quality signals:

- **Rule #1**: Hunter only evaluates patterns when price is within two strikes of a major institutional node. Hunter does not trade midpoints.

This guardrail keeps analysis anchored to areas where institutional participants are most likely active.

### Design Principles

- **Institutional first** — Emphasis on gamma nodes, order flow implications, and structural behavior rather than pure retail indicators.
- **Modular & Extensible** — Clean separation between engines (pattern detection, decision making, institutional analysis).
- **Local & Private** — Runs entirely client-side as a userscript. No data leaves your browser.
- **Actionable Output** — Clear stages, confidence levels, and reasons instead of black-box signals.

---

## Architecture Overview

Hunter is built in layers:

```
Skylit Heatseeker (app.skylit.ai)
        ↓  (Fetch Interception)
Hunter Overlay / Runtime (Userscript)
        ↓
HunterRuntime (builds market state + institutional structure)
        ↓
Engines Layer
   ├── HunterPatternEngine (Rug, Whipsaw, NodeDeflection, BeachBall, etc.)
   ├── HunterDecisionEngine
   ├── InstitutionalEvolutionEngine
   ├── InstitutionalMapEngine
   └── InstitutionalStructureEngine
        ↓
   Adapters & Connectors (Skylit integration, data connectors)
        ↓
   Runtime + Shared Utilities
```

- **UI Layer** (`ui/UserScripts/`): Safari userscript that creates the live overlay panel and intercepts Skylit data.
- **Runtime Layer** (`runtime/`): Orchestrates data flow, snapshot history, and calls into the engines.
- **Engines Layer** (`engines/`): The "brain" — specialized, composable engines for pattern detection and decision making.
- **Integration Layer** (`adapters/`, `connectors/`): Handles Skylit-specific data shapes and external data needs.
- **Utilities** (`utilities/research-ingestor/`): Data ingestion and research tools.

---

## Key Features (Current & Planned)

- **Live Fetch Interception** — Captures Skylit Heatseeker matrix responses in real time.
- **Institutional Structure Modeling** — Identifies King Gamma, strongest nodes, node roles, migration direction, ceilings/floors.
- **Pattern Detection Engine** — Multiple specialized detectors with staged logic (WATCHING → SETUP → FORMING → CONFIRMED):
  - Rug / Reverse Rug
  - Whipsaw
  - Node Deflection
  - Beach Ball, Pika Cloud, Rainbow Road, and others
- **Snapshot History** — Maintains per-symbol history for detecting changes over time.
- **Rich Output** — Candidate vs Confirmed patterns, confidence scores, clear reasons, required data flags.
- **Overlay UI** — Persistent, non-intrusive panel inside Skylit showing live analysis.
- **Modular Engines** — Easy to extend with new pattern detectors or decision logic.

---

## Current Status

**Version**: 0.6.0 (Prototype stage)

**What's Working**:
- Userscript runtime prototype that intercepts Skylit data
- Institutional node and structure building logic
- Snapshot history system
- `HunterPatternEngine` with multiple detectors and base class
- Strong modular architecture across engines, runtime, and UI

**In Progress / Next**:
- Full integration of Pattern Engine + Decision Engine into the runtime
- Completion of Institutional engines
- Polish on overlay UI and rendering
- Improved documentation and testing
- Research ingestor and data connector maturation

Hunter is under active development. The foundation is solid, but many components are still evolving.

---

## Getting Started (Userscript)

### Prerequisites
- Safari browser
- A userscript manager (recommended: **Tampermonkey** or **Violentmonkey** for Safari)

### Installation

1. Install a userscript manager in Safari.
2. Create a new userscript.
3. Paste the content of `ui/UserScripts/HunterOverlay_v0.6_RuntimePrototype.txt` (or the latest version).
4. Save and enable the script.
5. Navigate to [https://app.skylit.ai](https://app.skylit.ai) and open a Heatseeker view.

The Hunter overlay panel should appear and begin processing live matrix data.

> **Note**: This is currently a prototype. Some features (full pattern + decision output) are still being wired up.

---

## Project Structure

```
Hunter/
├── engines/                    # Core intelligence engines
│   ├── HunterPatternEngine/    # Pattern detection (Rug, Whipsaw, etc.)
│   ├── HunterDecisionEngine/
│   ├── InstitutionalEvolutionEngine/
│   ├── InstitutionalMapEngine/
│   └── InstitutionalStructureEngine/
├── ui/UserScripts/             # Safari userscript overlay + runtime prototype
├── runtime/                    # Orchestration and state management
├── adapters/Skylit/            # Skylit-specific integration
├── connectors/HunterDataConnector/
├── shared/                     # Shared utilities and types
├── utilities/research-ingestor/
├── build/                      # Build scripts (esbuild)
├── dist/                       # Build output
├── tests/                      # Tests
├── package.json
└── README.md
```

---

## Tech Stack

- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js (for development/build) + Browser (userscript)
- **Bundler**: esbuild
- **No heavy frameworks** — deliberate choice for performance and simplicity in a trading context

---

## Roadmap (High Level)

- [ ] Complete integration of Pattern Engine + Decision Engine into live runtime
- [ ] Finish and integrate Institutional engines
- [ ] Improve overlay UI/UX and add more visualization options
- [ ] Add comprehensive testing for detectors and structure builders
- [ ] Expand documentation (patterns reference, architecture diagrams)
- [ ] Explore optional backend/research components via the research ingestor
- [ ] Performance tuning and snapshot management improvements

---

## Contributing

This project is currently in active personal development. Feedback, ideas, and bug reports are welcome via GitHub issues.

If you'd like to contribute:
1. Fork the repo
2. Create a feature branch
3. Follow the existing modular patterns (especially the base detector + specific detector model)
4. Submit a pull request

Please keep the "Hunter Constitution" philosophy and focus on institutional node behavior in mind.

---

## License

Currently unlicensed. All rights reserved by the author during active development.

---

## Acknowledgments

Built to work alongside **Skylit Heatseeker** — an excellent professional gamma and order flow visualization tool.

Special thanks to the trading community focused on institutional gamma, order flow, and market structure analysis.

---

*Hunter is experimental trading software. Use at your own risk. Past performance and pattern detection do not guarantee future results.*

---

**Questions or feedback?** Open an issue or reach out.

*Last updated: July 2026*
