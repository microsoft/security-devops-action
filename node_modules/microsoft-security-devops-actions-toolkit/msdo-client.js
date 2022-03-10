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
exports.MsdoClient = void 0;
const path = __importStar(require("path"));
const process = __importStar(require("process"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const msdo_installer_1 = require("./msdo-installer");
class MsdoClient {
    constructor() {
        this.cliVersion = '0.*';
    }
    setupEnvironment() {
        return __awaiter(this, void 0, void 0, function* () {
            process.env.DOTNET_NOLOGO = 'true';
            console.log('------------------------------------------------------------------------------');
            if (!process.env.MSDO_FILEPATH) {
                let cliVersion = this.resolveCliVersion();
                let msdoInstaller = new msdo_installer_1.MsdoInstaller();
                yield msdoInstaller.install(cliVersion);
            }
            console.log('------------------------------------------------------------------------------');
        });
    }
    resolveCliVersion() {
        let cliVersion = this.cliVersion;
        if (process.env.MSDO_VERSION) {
            cliVersion = process.env.MSDO_VERSION;
        }
        return cliVersion;
    }
    isNullOrWhiteSpace(value) {
        return !value || !value.trim();
    }
    getCliFilePath() {
        let cliFilePath = process.env.MSDO_FILEPATH;
        core.debug(`cliFilePath = ${cliFilePath}`);
        return cliFilePath;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let cliFilePath = this.getCliFilePath();
                yield exec.exec(cliFilePath, ['init', '--force']);
            }
            catch (error) {
                core.debug(error);
            }
        });
    }
    run(inputArgs, telemetryEnvironment = 'github') {
        return __awaiter(this, void 0, void 0, function* () {
            let cliFilePath = null;
            let args = [];
            try {
                yield this.setupEnvironment();
                yield this.init();
                cliFilePath = process.env.MSDO_FILEPATH;
                core.debug(`cliFilePath = ${cliFilePath}`);
                if (inputArgs != null) {
                    for (let i = 0; i < inputArgs.length; i++) {
                        args.push(inputArgs[i]);
                    }
                }
                args.push('--not-break-on-detections');
                if (core.isDebug()) {
                    args.push('--logger-level');
                    args.push('trace');
                }
                let sarifFile = path.join(process.env.GITHUB_WORKSPACE, '.gdn', 'msdo.sarif');
                core.debug(`sarifFile = ${sarifFile}`);
                core.exportVariable('MSDO_SARIF_FILE', sarifFile);
                core.setOutput('sarifFile', sarifFile);
                args.push('--export-breaking-results-to-file');
                args.push(`${sarifFile}`);
                args.push('--telemetry-environment');
                args.push(telemetryEnvironment);
            }
            catch (error) {
                core.error('Exception occurred while initializing MSDO:');
                core.error(error);
                core.setFailed(error);
                return;
            }
            try {
                core.debug('Running Microsoft Security DevOps...');
                yield exec.exec(cliFilePath, args);
            }
            catch (error) {
                core.setFailed(error);
                return;
            }
        });
    }
}
exports.MsdoClient = MsdoClient;
