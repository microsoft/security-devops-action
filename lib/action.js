"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const msca_toolkit_1 = require("./msca-toolkit/msca-toolkit");
let action = new msca_toolkit_1.MscaAction();
let args = [];
let config = core.getInput('config');
if (!action.isNullOrWhiteSpace(config)) {
    args.push('-c');
    args.push(config);
    ;
}
let policy = core.getInput('policy');
if (!action.isNullOrWhiteSpace(policy)) {
    args.push('-p');
    args.push(policy);
    ;
}
action.run('run', args);
