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
exports.MicrosoftSecurityDevOps = void 0;
const core = __importStar(require("@actions/core"));
const msdo_helpers_1 = require("./msdo-helpers");
const client = __importStar(require("@microsoft/security-devops-actions-toolkit/msdo-client"));
const common = __importStar(require("@microsoft/security-devops-actions-toolkit/msdo-common"));
class MicrosoftSecurityDevOps {
    constructor() {
        this.succeedOnError = false;
    }
    runPreJob() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    runPostJob() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    runMain() {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('MicrosoftSecurityDevOps.runMain - Running MSDO...');
            let args = ['run'];
            let config = core.getInput('config');
            if (!common.isNullOrWhiteSpace(config)) {
                args.push('-c');
                args.push(config);
            }
            let policy = core.getInput('policy');
            if (common.isNullOrWhiteSpace(policy)) {
                policy = "GitHub";
            }
            args.push('-p');
            args.push(policy);
            let categoriesString = core.getInput('categories');
            if (!common.isNullOrWhiteSpace(categoriesString)) {
                args.push('--categories');
                let categories = categoriesString.split(',');
                for (let i = 0; i < categories.length; i++) {
                    let category = categories[i];
                    if (!common.isNullOrWhiteSpace(category)) {
                        args.push(category.trim());
                    }
                }
            }
            let languagesString = core.getInput('languages');
            if (!common.isNullOrWhiteSpace(languagesString)) {
                args.push('--languages');
                let languages = languagesString.split(',');
                for (let i = 0; i < languages.length; i++) {
                    let language = languages[i];
                    if (!common.isNullOrWhiteSpace(language)) {
                        args.push(language.trim());
                    }
                }
            }
            let toolsString = core.getInput('tools');
            let includedTools = [];
            if (!common.isNullOrWhiteSpace(toolsString)) {
                let tools = toolsString.split(',');
                for (let i = 0; i < tools.length; i++) {
                    let tool = tools[i];
                    let toolTrimmed = tool.trim();
                    if (!common.isNullOrWhiteSpace(tool)
                        && tool != msdo_helpers_1.Tools.ContainerMapping
                        && includedTools.indexOf(toolTrimmed) == -1) {
                        if (includedTools.length == 0) {
                            args.push('--tool');
                        }
                        args.push(toolTrimmed);
                        includedTools.push(toolTrimmed);
                    }
                }
            }
            let includeToolsString = core.getInput('includeTools');
            if (!common.isNullOrWhiteSpace(includeToolsString)) {
                let includeTools = includeToolsString.split(',');
                for (let i = 0; i < includeTools.length; i++) {
                    let includeTool = includeTools[i];
                    let toolTrimmed = includeTool.trim();
                    if (!common.isNullOrWhiteSpace(includeTool)
                        && includeTool != msdo_helpers_1.Tools.ContainerMapping
                        && includedTools.indexOf(toolTrimmed) == -1) {
                        if (includedTools.length == 0) {
                            args.push('--tool');
                        }
                        args.push(toolTrimmed);
                        includedTools.push(toolTrimmed);
                    }
                }
            }
            args.push('--github');
            yield client.run(args, 'microsoft/security-devops-action');
        });
    }
}
exports.MicrosoftSecurityDevOps = MicrosoftSecurityDevOps;
