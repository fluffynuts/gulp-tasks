import { Stream } from "stream";

(function() {
// import to patch streams to have an .onAny handler where you can spy on all
//  events from the stream
    type Listener = ((...args: any[]) => void);

    interface MonkeyPatchedStream extends Stream {
        _onAnyListeners: Listener[];

    }


    function patchEventEmitters() {
        const EventEmitter = require("events");
        const originalEmit = EventEmitter.prototype.emit;
        Object.assign(EventEmitter.prototype, {
            emit: function(this: MonkeyPatchedStream, ...args: any[]) {
                if (this._onAnyListeners) {
                    this._onAnyListeners.forEach(
                        listener => {
                            try {
                                listener(args);
                            } catch (e) {
                                console.error(`onAny listener error: ${e}`);
                            }
                        }
                    );
                }
                return originalEmit.apply(this, args);
            },
            onAny: function(this: MonkeyPatchedStream, func: Listener) {
                if (typeof func !== "function") {
                    throw new Error("Invalid type");
                }
                if (!this._onAnyListeners) {
                    this._onAnyListeners = [];
                }
                this._onAnyListeners.push(func);
            },
            removeOnAny: function(this: MonkeyPatchedStream, func: Listener) {
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
