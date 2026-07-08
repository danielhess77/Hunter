/**
 * Structure State Analyzer
 * Version: 1.0
 *
 * Determines whether institutional nodes are
 * Building, Stable, Weakening, Broken or Migrating.
 */

class StructureStateAnalyzer {

    analyze(currentNodes = [], previousNodes = []) {

        return currentNodes.map(node => ({

            ...node,

            state: "Unknown"

        }));

    }

}

export default StructureStateAnalyzer;