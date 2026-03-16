"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutor = void 0;
function getExecutor(runner) {
    return new runner();
}
exports.getExecutor = getExecutor;
