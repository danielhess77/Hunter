/**
 * Institutional Evolution Engine
 * Version: 0.8.0
 *
 * Compares the previous institutional map
 * against the current map.
 */

class InstitutionalEvolutionEngine {

    analyze(currentNodes, previousNodes) {

        if (!previousNodes) {

            return {
                hasHistory: false,
                nodeChanges: []
            };

        }

        const nodeChanges = [];

        currentNodes.forEach(current => {

            const previous =
                previousNodes.find(
                    node => node.strike === current.strike
                );

            if (!previous) {

                nodeChanges.push({

                    strike: current.strike,

                    state: "NEW_NODE",

                    previousMagnitude: 0,

                    currentMagnitude:
                        current.gammaMagnitude

                });

                return;

            }

            const pctChange =
                (
                    (current.gammaMagnitude -
                        previous.gammaMagnitude)
                    /
                    previous.gammaMagnitude
                ) * 100;

            nodeChanges.push({

                strike: current.strike,

                previousMagnitude:
                    previous.gammaMagnitude,

                currentMagnitude:
                    current.gammaMagnitude,

                percentChange: pctChange,

                state: "UNCHANGED"

            });

        });

        return {

            hasHistory: true,

            nodeChanges

        };

    }

}

export default InstitutionalEvolutionEngine;