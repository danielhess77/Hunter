/**
 * Matrix Parser
 * Version: 1.0
 *
 * Converts a Heatseeker matrix into
 * institutional node objects.
 */

class MatrixParser {

    parse(marketState) {

        const nodes = [];

        const strikes = marketState.strikes;
        const gamma = marketState.gamma;
        const vanna = marketState.vanna;

        for (let strikeIndex = 0; strikeIndex < strikes.length; strikeIndex++) {

            const strike = strikes[strikeIndex];

            const gammaRow = gamma[strikeIndex] || [];
            const vannaRow = vanna[strikeIndex] || [];

            nodes.push({
                strike,
                gamma: gammaRow,
                vanna: vannaRow
            });

        }

        return nodes;

    }

}

export default MatrixParser;