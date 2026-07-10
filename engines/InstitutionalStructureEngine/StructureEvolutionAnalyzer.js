/**
 * Structure Evolution Analyzer
 * Version: 0.9.0
 *
 * Compares previous and current
 * institutional structure.
 */

class StructureEvolutionAnalyzer {

    analyze(currentNodes, previousNodes = []) {

        if (!previousNodes.length) {

            return {

                hasHistory: false,

                changes: []

            };

        }

        const changes = [];

        currentNodes.forEach(current => {

            const previous =
                previousNodes.find(
                    node => node.strike === current.strike
                );

            if (!previous) {

                changes.push({

                    strike: current.strike,

                    state: "NEW",

                    percentChange: 100

                });

                return;

            }

            const previousMagnitude =
                previous.gammaMagnitude;

            const currentMagnitude =
                current.gammaMagnitude;

            const percentChange =
                previousMagnitude === 0
                    ? 0
                    : (
                        (
                            currentMagnitude -
                            previousMagnitude
                        ) /
                        previousMagnitude
                    ) * 100;

            let state = "TRANSITIONAL";

            if (percentChange >= 20) {

            state = "BUILDING";

}
            else if (percentChange <= -20) {

            state = "WEAKENING";

}
            else if (
            percentChange >= -10 &&
            percentChange <= 10
) {

            state = "STABLE";

}

            changes.push({

                strike: current.strike,

                previousMagnitude,

                currentMagnitude,

                percentChange,

                state

            });

        });

        return {

            hasHistory: true,

            changes

        };

    }

}

export default StructureEvolutionAnalyzer;