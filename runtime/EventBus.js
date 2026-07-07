/**
 * Event Bus
 * Version: 1.0
 *
 * Allows Hunter modules to communicate.
 */

class EventBus {

    constructor() {
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (!this.listeners[event]) return;

        this.listeners[event].forEach(callback => callback(data));
    }

}

export default EventBus;