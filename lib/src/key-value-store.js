"use strict";
exports.__esModule = true;
exports.KeyValueStore = void 0;
var KeyValueStore = /** @class */ (function () {
    function KeyValueStore() {
        this.cache = new Map();
    }
    KeyValueStore.prototype.setNewRecord = function (key, record) {
        this.cache.set(key, record);
    };
    KeyValueStore.prototype.getRecord = function (key) {
        return this.cache.get(key);
    };
    return KeyValueStore;
}());
exports.KeyValueStore = KeyValueStore;
