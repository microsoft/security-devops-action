"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const msdo_1 = require("./msdo");
const msdo_helpers_1 = require("./msdo-helpers");
const container_mapping_1 = require("./container-mapping");
let succeedOnError = false;
function _getMsdoRunner(inputString) {
    var commandType = inputString;
    switch (commandType) {
        case msdo_helpers_1.CommandType.PreJob:
        case msdo_helpers_1.CommandType.PostJob:
            return _getExecutor(container_mapping_1.ContainerMapping, commandType);
        case msdo_helpers_1.CommandType.Run:
            return _getExecutor(msdo_1.MicrosoftSecurityDevOps, commandType);
        default:
            throw new Error(`Invalid command type for the task: ${this.commandType}`);
    }
}
function _getExecutor(runner, commandType) {
    return new runner(commandType);
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const commandType = core.getInput(msdo_helpers_1.Inputs.CommandType) || msdo_helpers_1.CommandType.Run;
        core.debug('Running Command: ' + commandType);
        const msdoRunner = _getMsdoRunner(commandType);
        succeedOnError = msdoRunner.succeedOnError;
        yield msdoRunner.run();
    });
}
run().catch((error) => core.setFailed(error));
run().catch(error => {
    if (succeedOnError) {
        (0, msdo_helpers_1.writeToOutStream)('Ran into error: ' + error);
    }
    else {
        core.setFailed(error);
    }
    console.log('------------------------------------------------------------------------------');
    console.log('Effective September 20th 2023, the Secret Scanning option (CredScan) within Microsoft Security DevOps (MSDO) Extension for Azure DevOps is deprecated. MSDO Secret Scanning is replaced by the Configure GitHub Advanced Security for Azure DevOps features - https://learn.microsoft.com/en-us/azure/devops/repos/security/configure-github-advanced-security-features#set-up-secret-scanning.');
    console.log('------------------------------------------------------------------------------');
});
