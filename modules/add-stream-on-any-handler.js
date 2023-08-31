"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
(function () {
    function patchEventEmitters() {
        const EventEmitter = require("events");
        const originalEmit = EventEmitter.prototype.emit;
        Object.assign(EventEmitter.prototype, {
            emit: function (...args) {
                if (this._onAnyListeners) {
                    this._onAnyListeners.forEach(listener => {
                        try {
                            listener(args);
                        }
                        catch (e) {
                            console.error(`onAny listener error: ${e}`);
                        }
                    });
                }
                return originalEmit.apply(this, args);
            },
            onAny: function (func) {
                if (typeof func !== "function") {
                    throw new Error("Invalid type");
                }
                if (!this._onAnyListeners) {
                    this._onAnyListeners = [];
                }
                this._onAnyListeners.push(func);
            },
            removeOnAny: function (func) {
                const index = this._onAnyListeners.indexOf(func);
                if (index === -1) {
                    return;
                }
                this._onAnyListeners.splice(index, 1);
            }
        });
    }
    patchEventEmitters();
})();
