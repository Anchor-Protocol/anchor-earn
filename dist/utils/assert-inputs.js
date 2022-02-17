"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertInput = void 0;
function assertInput(customSigner, customBroadcaster) {
    if (customSigner && customBroadcaster) {
        throw new Error('Either customSigner or customBroadcaster must be provided');
    }
}
exports.assertInput = assertInput;
