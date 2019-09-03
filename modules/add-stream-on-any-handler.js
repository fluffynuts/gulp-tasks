// import to patch streams to have an .onAny handler where you can spy on all
//  events from the stream
function patchEventEmitters() {
  var EventEmitter = require("events");
  var origemit = EventEmitter.prototype.emit;
  Object.assign(EventEmitter.prototype, {
    emit: function() {
      if (this._onAnyListeners) {
        this._onAnyListeners.forEach(listener =>
          listener.apply(this, arguments)
        );
      }
      return origemit.apply(this, arguments);
    },
    onAny: function(func) {
      if (typeof func !== "function") {
        throw new Error("Invalid type");
      }
      if (!this._onAnyListeners) this._onAnyListeners = [];
      this._onAnyListeners.push(func);
    },
    removeOnAny: function(func) {
      const index = this._onAnyListeners.indexOf(func);
      if (index === -1) {
        return;
      }
      this._onAnyListeners.splice(index, 1);
    }
  });
}
patchEventEmitters();
