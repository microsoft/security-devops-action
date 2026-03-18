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
exports.MicrosoftDefenderCLI = void 0;
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
const defender_helpers_1 = require("./defender-helpers");
const defender_client_1 = require("./defender-client");
const job_summary_1 = require("./job-summary");
class MicrosoftDefenderCLI {
    constructor() {
        this.prSummaryEnabled = true;
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
            yield this.runDefenderCLI();
        });
    }
    runDefenderCLI() {
        return __awaiter(this, void 0, void 0, function* () {
            const debugInput = core.getInput(defender_helpers_1.Inputs.Debug);
            const debug = debugInput ? debugInput.toLowerCase() === 'true' : false;
            if (debug) {
                (0, defender_helpers_1.setupDebugLogging)(true);
                core.debug('Debug logging enabled');
            }
            const command = core.getInput(defender_helpers_1.Inputs.Command) || 'fs';
            const scanType = (0, defender_helpers_1.validateScanType)(command);
            const prSummaryInput = core.getInput(defender_helpers_1.Inputs.PrSummary);
            this.prSummaryEnabled = prSummaryInput ? prSummaryInput.toLowerCase() !== 'false' : true;
            core.debug(`PR Summary enabled: ${this.prSummaryEnabled}`);
            const argsInput = core.getInput(defender_helpers_1.Inputs.Args) || '';
            let additionalArgs = (0, defender_helpers_1.parseAdditionalArgs)(argsInput);
            let target;
            switch (scanType) {
                case defender_helpers_1.ScanType.FileSystem:
                    const fileSystemPath = core.getInput(defender_helpers_1.Inputs.FileSystemPath) ||
                        process.env['GITHUB_WORKSPACE'] ||
                        process.cwd();
                    target = (0, defender_helpers_1.validateFileSystemPath)(fileSystemPath);
                    core.debug(`Filesystem scan using directory: ${target}`);
                    break;
                case defender_helpers_1.ScanType.Image:
                    const imageName = core.getInput(defender_helpers_1.Inputs.ImageName);
                    if (!imageName) {
                        throw new Error('Image name is required for image scan');
                    }
                    target = (0, defender_helpers_1.validateImageName)(imageName);
                    break;
                case defender_helpers_1.ScanType.Model:
                    const modelPath = core.getInput(defender_helpers_1.Inputs.ModelPath);
                    if (!modelPath) {
                        throw new Error('Model path is required for model scan');
                    }
                    target = (0, defender_helpers_1.validateModelPath)(modelPath);
                    break;
                default:
                    throw new Error(`Unsupported scan type: ${scanType}`);
            }
            const breakInput = core.getInput(defender_helpers_1.Inputs.Break);
            const breakOnCritical = breakInput ? breakInput.toLowerCase() === 'true' : false;
            additionalArgs = additionalArgs.filter(arg => arg !== '--defender-break');
            if (breakOnCritical) {
                additionalArgs.push('--defender-break');
                core.debug('Break on critical vulnerability enabled: adding --defender-break flag');
            }
            additionalArgs = additionalArgs.filter(arg => arg !== '--defender-debug');
            if (debug) {
                additionalArgs.push('--defender-debug');
                core.debug('Debug mode enabled: adding --defender-debug flag');
            }
            let successfulExitCodes = [0];
            const outputPath = path.join(process.env['RUNNER_TEMP'] || process.cwd(), 'defender.sarif');
            const policyInput = core.getInput(defender_helpers_1.Inputs.Policy) || 'mdc';
            let policy;
            if (policyInput === 'none') {
                policy = '';
            }
            else {
                policy = policyInput;
            }
            core.debug(`Scan Type: ${scanType}`);
            core.debug(`Target: ${target}`);
            core.debug(`Policy: ${policy}`);
            core.debug(`Output Path: ${outputPath}`);
            if (additionalArgs.length > 0) {
                core.debug(`Additional Arguments: ${additionalArgs.join(' ')}`);
            }
            process.env['Defender_Extension'] = 'true';
            core.debug('Environment variable set: Defender_Extension=true');
            core.setOutput('sarifFile', outputPath);
            core.exportVariable('DEFENDER_SARIF_FILE', outputPath);
            core.debug(`sarifFile output set to: ${outputPath}`);
            try {
                switch (scanType) {
                    case defender_helpers_1.ScanType.FileSystem:
                        yield (0, defender_client_1.scanDirectory)(target, policy, outputPath, successfulExitCodes, additionalArgs);
                        break;
                    case defender_helpers_1.ScanType.Image:
                        yield (0, defender_client_1.scanImage)(target, policy, outputPath, successfulExitCodes, additionalArgs);
                        break;
                    case defender_helpers_1.ScanType.Model:
                        yield this.runModelScan(target, policy, outputPath, successfulExitCodes, additionalArgs);
                        break;
                }
                if (this.prSummaryEnabled) {
                    core.debug('Posting job summary...');
                    yield (0, job_summary_1.postJobSummary)(outputPath, scanType, target);
                }
            }
            catch (error) {
                if (this.prSummaryEnabled) {
                    try {
                        yield (0, job_summary_1.postJobSummary)(outputPath, scanType, target);
                    }
                    catch (summaryError) {
                        core.debug(`Failed to post summary after error: ${summaryError}`);
                    }
                }
                core.error(`Defender CLI execution failed: ${error}`);
                throw error;
            }
        });
    }
    runModelScan(modelPath, policy, outputPath, successfulExitCodes, additionalArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, defender_client_1.setupEnvironment)();
            const cliFilePath = process.env['DEFENDER_FILEPATH'];
            if (!cliFilePath) {
                throw new Error('DEFENDER_FILEPATH environment variable is not set. Defender CLI may not be installed.');
            }
            const args = [
                'scan',
                'model',
                modelPath,
            ];
            if (policy) {
                args.push('--defender-policy', policy);
            }
            args.push('--defender-output', outputPath);
            if (additionalArgs && additionalArgs.length > 0) {
                args.push(...additionalArgs);
                core.debug(`Appending additional arguments: ${additionalArgs.join(' ')}`);
            }
            const isDebug = process.env['RUNNER_DEBUG'] === '1' || core.isDebug();
            if (isDebug && !args.includes('--defender-debug')) {
                args.push('--defender-debug');
            }
            core.debug('Running Microsoft Defender CLI for model scan...');
            const exitCode = yield exec.exec(cliFilePath, args, {
                ignoreReturnCode: true
            });
            let success = false;
            for (const successCode of successfulExitCodes) {
                if (exitCode === successCode) {
                    success = true;
                    break;
                }
            }
            if (!success) {
                throw new Error(`Defender CLI exited with an error exit code: ${exitCode}`);
            }
        });
    }
}
exports.MicrosoftDefenderCLI = MicrosoftDefenderCLI;
