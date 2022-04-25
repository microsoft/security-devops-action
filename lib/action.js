"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
const microsoft_security_devops_actions_toolkit_1 = require("microsoft-security-devops-actions-toolkit");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let client = new microsoft_security_devops_actions_toolkit_1.MsdoClient();
        let args = ['run'];
        let config = core.getInput('config');
        if (!client.isNullOrWhiteSpace(config)) {
            args.push('-c');
            args.push(config);
        }
        let policy = core.getInput('policy');
        if (client.isNullOrWhiteSpace(policy)) {
            policy = "GitHub";
        }
        args.push('-p');
        args.push(policy);
        let categoriesString = core.getInput('categories');
        if (!client.isNullOrWhiteSpace(categoriesString)) {
            args.push('--categories');
            let categories = categoriesString.split(',');
            for (let i = 0; i < categories.length; i++) {
                let category = categories[i];
                if (!client.isNullOrWhiteSpace(category)) {
                    args.push(category.trim());
                }
            }
        }
        let languagesString = core.getInput('languages');
        if (!client.isNullOrWhiteSpace(languagesString)) {
            let languages = languagesString.split(',');
            args.push('--languages');
            for (let i = 0; i < languages.length; i++) {
                let language = languages[i];
                if (!client.isNullOrWhiteSpace(language)) {
                    args.push(language.trim());
                }
            }
        }
        let toolsString = core.getInput('tools');
        if (!client.isNullOrWhiteSpace(toolsString)) {
            let tools = toolsString.split(',');
            args.push('--tool');
            for (let i = 0; i < tools.length; i++) {
                let tool = tools[i];
                if (!client.isNullOrWhiteSpace(tool)) {
                    args.push(tool.trim());
                }
            }
        }
        args.push('--github');
        yield client.run(args, 'microsoft/security-devops-action');
    });
}
run().catch((error) => core.setFailed(error));
