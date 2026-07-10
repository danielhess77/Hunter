/**
 * Hunter Memory
 * Version: 0.7.0
 *
 * Stores the previous institutional snapshot so
 * Hunter can recognize changes over time.
 *
 * This is the foundation for:
 *
 * • Building Gamma
 * • Weakening Gamma
 * • Rolling Floors
 * • Rolling Ceilings
 * • Migration
 * • Rugs
 * • Reverse Rugs
 * • Beach Balls
 * • Rainbow Roads
 */

class HunterMemory {

    constructor() {

        this.previousSnapshot = null;

        this.currentSnapshot = null;

    }

    update(snapshot) {

        this.previousSnapshot = this.currentSnapshot;

        this.currentSnapshot = snapshot;

    }

    hasHistory() {

        return this.previousSnapshot !== null;

    }

    getCurrent() {

        return this.currentSnapshot;

    }

    getPrevious() {

        return this.previousSnapshot;

    }

    reset() {

        this.previousSnapshot = null;

        this.currentSnapshot = null;

    }

}

export default HunterMemory;