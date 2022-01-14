"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const process = __importStar(require("process"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const msca_installer_1 = require("./msca-installer");
class MscaClient {
    constructor() {
        this.cliVersion = '0.*';
    }
    setupEnvironment() {
        return __awaiter(this, void 0, void 0, function* () {
            process.env.DOTNET_NOLOGO = 'true';
            console.log('------------------------------------------------------------------------------');
            if (!process.env.MSCA_FILEPATH) {
                let cliVersion = this.resolveCliVersion();
                let mscaInstaller = new msca_installer_1.MscaInstaller();
                yield mscaInstaller.install(cliVersion);
            }
            console.log('------------------------------------------------------------------------------');
        });
    }
    resolveCliVersion() {
        let cliVersion = this.cliVersion;
        if (process.env.MSCA_VERSION) {
            cliVersion = process.env.MSCA_VERSION;
        }
        return cliVersion;
    }
    isNullOrWhiteSpace(value) {
        return !value || !value.trim();
    }
    getCliFilePath() {
        let cliFilePath = process.env.MSCA_FILEPATH;
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
    run(inputArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            let cliFilePath = null;
            let args = [];
            try {
                yield this.setupEnvironment();
                yield this.init();
                cliFilePath = process.env.MSCA_FILEPATH;
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
                let sarifFile = path.join(process.env.GITHUB_WORKSPACE, '.gdn', 'msca.sarif');
                core.debug(`sarifFile = ${sarifFile}`);
                core.exportVariable('MSCA_SARIF_FILE', sarifFile);
                core.setOutput('sarifFile', sarifFile);
                args.push('--export-breaking-results-to-file');
                args.push(`${sarifFile}`);
            }
            catch (error) {
                error('Exception occurred while initializing MSCA:');
                error(error);
                core.setFailed(error);
                return;
            }
            try {
                core.debug('Running Microsoft Security Code Analysis...');
                yield exec.exec(cliFilePath, args);
            }
            catch (error) {
                error(error);
                core.setFailed(error);
                return;
            }
        });
    }
}
exports.MscaClient = MscaClient;
