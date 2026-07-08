/**
 * Matrix Parser
 * Version: 1.2
 *
 * Converts a Heatseeker matrix into
 * normalized institutional node objects.
 *
 * Important:
 * Gamma and Vanna are kept separate.
 * Hunter does not combine them into one magnitude.
 */

class MatrixParser {

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

}

export default MatrixParser;