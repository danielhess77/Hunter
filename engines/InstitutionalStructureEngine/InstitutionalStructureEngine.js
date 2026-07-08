/**
 * Institutional Structure Engine
 * Version: 1.0
 *
 * Determines structural roles
 * of institutional nodes.
 */

class InstitutionalStructureEngine {

    analyze(nodes = []) {

        return {

            nodes,

            kingNode: nodes.find(node => node.isKingNode),

            floors: nodes.filter(node => node.isFloor),

            ceilings: nodes.filter(node => node.isCeiling),

            gatekeepers: nodes.filter(node => node.isGatekeeper)

        };

    }

}

export default InstitutionalStructureEngine;