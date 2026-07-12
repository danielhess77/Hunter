/**
 * Structure Navigator
 *
 * Helper functions for navigating
 * institutional structure.
 */

class StructureNavigator {

    /**
     * Returns the next N strikes
     * above or below a strike.
     */

    getAdjacentStrikes(
        nodes,
        strike,
        direction,
        count = 3
    ) {

        const sorted = [...nodes].sort(
            (a, b) => a.strike - b.strike
        );

        const index =
            sorted.findIndex(
                node => node.strike === strike
            );

        if (index === -1) {

            return [];

        }

        if (direction === "UP") {

            return sorted.slice(
                index + 1,
                index + 1 + count
            );

        }

        return sorted.slice(
            Math.max(0, index - count),
            index
        );

    }

}

export default StructureNavigator;