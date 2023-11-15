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
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const msdo_1 = require("./msdo");
const msdo_helpers_1 = require("./msdo-helpers");
const container_mapping_1 = require("./container-mapping");
const common = __importStar(require("@microsoft/security-devops-actions-toolkit/msdo-common"));
function run(runnerString) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = runnerString;
        let command = getCommandType();
        switch (runner) {
            case msdo_helpers_1.RunnerType.Main:
                yield _runMain(command);
                break;
            case msdo_helpers_1.RunnerType.Pre:
                yield _runPreJob(command);
                break;
            case msdo_helpers_1.RunnerType.Post:
                yield _runPostJob(command);
                break;
            default:
                throw new Error(`Invalid source type for the task: ${runnerString}`);
        }
    });
}
exports.run = run;
function _runPreJob(command) {
    return __awaiter(this, void 0, void 0, function* () {
        if (command != msdo_helpers_1.CommandType.All) {
            return;
        }
        if (_toolIsEnabled(msdo_helpers_1.Tools.ContainerMapping)) {
            yield _getExecutor(container_mapping_1.ContainerMapping).runPreJob();
        }
    });
}
function _runPostJob(command) {
    return __awaiter(this, void 0, void 0, function* () {
        if (command != msdo_helpers_1.CommandType.All) {
            return;
        }
        if (_toolIsEnabled(msdo_helpers_1.Tools.ContainerMapping)) {
            yield _getExecutor(container_mapping_1.ContainerMapping).runPostJob();
        }
    });
}
function _runMain(command) {
    return __awaiter(this, void 0, void 0, function* () {
        if (command == msdo_helpers_1.CommandType.PreJob) {
            yield _runPreJob(command);
        }
        else if (command == msdo_helpers_1.CommandType.PostJob) {
            yield _runPostJob(command);
        }
        else if (command == msdo_helpers_1.CommandType.All || command == msdo_helpers_1.CommandType.Run) {
            if (_toolIsEnabledOnInput(msdo_helpers_1.Inputs.Tools, msdo_helpers_1.Tools.ContainerMapping, true)) {
                console.log("Scanning is not enabled. Skipping...");
            }
            else {
                yield _getExecutor(msdo_1.MicrosoftSecurityDevOps).runMain();
            }
        }
        else {
            throw new Error(`Invalid command type for the main task: ${command}`);
        }
    });
}
function _toolIsEnabled(toolName) {
    let enabled = false;
    enabled = _toolIsEnabledOnInput(msdo_helpers_1.Inputs.Tools, toolName, false);
    if (!enabled) {
        enabled = _toolIsEnabledOnInput(msdo_helpers_1.Inputs.IncludeTools, toolName, false);
    }
    return enabled;
}
function _toolIsEnabledOnInput(inputName, toolName, isOnlyTool = false) {
    let enabled = false;
    let toolsString = core.getInput(inputName);
    if (!common.isNullOrWhiteSpace(toolsString)) {
        let tools = toolsString.split(',');
        if (isOnlyTool && tools.length > 1) {
            enabled = false;
        }
        else {
            const toolIndex = tools.indexOf(toolName);
            enabled = toolIndex > -1;
        }
    }
    return enabled;
}
function _getExecutor(runner) {
    return new runner();
}
function getCommandType() {
    const commandTypeString = core.getInput(msdo_helpers_1.Inputs.Command) || msdo_helpers_1.CommandType.Run;
    return commandTypeString;
}
