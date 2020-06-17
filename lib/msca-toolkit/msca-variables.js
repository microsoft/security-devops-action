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
function setup(actionDirectory) {
    // set up the input environment variables
    process.env.MSCA_AGENT_ACTIONDIRECTORY = actionDirectory;
    const actionFilePath = `${actionDirectory}/action.yml`;
    core.debug(`actionFilePath = ${actionFilePath}`);
    const actionFile = require(actionFilePath);
    const actionName = actionFile.name.toUpperCase();
    core.debug(`actionName = ${actionName}`);
    for (const actionInput of actionFile.inputs) {
        const inputValue = core.getInput(`${actionInput.name}`);
        if (inputValue != null) {
            const varName = `MSCAI_${actionName}_${actionInput.name.toUpperCase()}`;
            const varValue = process.env[varName];
            if (varValue == null) {
                core.debug(`Input : ${varName}`);
                process.env[varName] = inputValue;
            }
            else {
                core.debug(`Override : ${varName}`);
            }
        }
    }
}
exports.setup = setup;
