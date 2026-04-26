"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutor = getExecutor;
function getExecutor(runner) {
    return new runner();
}
