"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONSerializable = exports.prepareSignBytes = void 0;
function prepareSignBytes(obj) {
    if (Array.isArray(obj)) {
        return obj.map(prepareSignBytes);
    }
    // string or number
    if (typeof obj !== `object`) {
        return obj;
    }
    const sorted = {};
    Object.keys(obj)
        .sort()
        .forEach((key) => {
        if (obj[key] === undefined || obj[key] === null)
            return;
        sorted[key] = prepareSignBytes(obj[key]);
    });
    return sorted;
}
exports.prepareSignBytes = prepareSignBytes;
class JSONSerializable {
    toJSON() {
        return JSON.stringify(prepareSignBytes(this.toData()));
    }
}
exports.JSONSerializable = JSONSerializable;
