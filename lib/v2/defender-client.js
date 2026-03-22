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
exports.setupEnvironment = exports.scanModel = exports.scanImage = exports.scanDirectory = void 0;
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const installer = __importStar(require("./defender-installer"));
function scanDirectory(directoryPath, policy, outputPath, successfulExitCodes, additionalArgs) {
    return __awaiter(this, void 0, void 0, function* () {
        yield scan('fs', directoryPath, policy, outputPath, successfulExitCodes, additionalArgs);
    });
}
exports.scanDirectory = scanDirectory;
function scanImage(imageName, policy, outputPath, successfulExitCodes, additionalArgs) {
    return __awaiter(this, void 0, void 0, function* () {
        yield scan('image', imageName, policy, outputPath, successfulExitCodes, additionalArgs);
    });
}
exports.scanImage = scanImage;
function scanModel(modelPath, policy, outputPath, successfulExitCodes, additionalArgs) {
    return __awaiter(this, void 0, void 0, function* () {
        yield scan('model', modelPath, policy, outputPath, successfulExitCodes, additionalArgs);
    });
}
exports.scanModel = scanModel;
function scan(scanType, target, policy, outputPath, successfulExitCodes, additionalArgs) {
    return __awaiter(this, void 0, void 0, function* () {
        const resolvedPolicy = policy || 'mdc';
        const resolvedOutputPath = outputPath || path.join(process.env['RUNNER_TEMP'] || process.cwd(), 'defender.sarif');
        const inputArgs = [
            'scan',
            scanType,
            target,
            '--defender-policy',
            resolvedPolicy,
            '--defender-output',
            resolvedOutputPath
        ];
        if (additionalArgs && additionalArgs.length > 0) {
            inputArgs.push(...additionalArgs);
        }
        yield runDefenderCli(inputArgs, successfulExitCodes);
    });
}
function runDefenderCli(inputArgs, successfulExitCodes) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setupEnvironment();
        const cliFilePath = getCliFilePath();
        if (!cliFilePath) {
            throw new Error('DEFENDER_FILEPATH environment variable is not set. Defender CLI may not be installed.');
        }
        core.debug(`Running Defender CLI: ${cliFilePath} ${inputArgs.join(' ')}`);
        const isDebug = process.env['RUNNER_DEBUG'] === '1' || core.isDebug();
        if (isDebug && !inputArgs.includes('--defender-debug')) {
            inputArgs.push('--defender-debug');
        }
        const exitCode = yield exec.exec(cliFilePath, inputArgs, {
            ignoreReturnCode: true
        });
        const validExitCodes = successfulExitCodes || [0];
        if (!validExitCodes.includes(exitCode)) {
            throw new Error(`Defender CLI exited with an error exit code: ${exitCode}`);
        }
        core.debug(`Defender CLI completed successfully with exit code: ${exitCode}`);
    });
}
function setupEnvironment() {
    return __awaiter(this, void 0, void 0, function* () {
        const toolCacheDir = process.env['RUNNER_TOOL_CACHE'] || path.join(os.homedir(), '.defender');
        const defenderDir = path.join(toolCacheDir, '_defender');
        if (!fs.existsSync(defenderDir)) {
            fs.mkdirSync(defenderDir, { recursive: true });
        }
        const packagesDirectory = process.env['DEFENDER_PACKAGES_DIRECTORY'] || path.join(defenderDir, 'packages');
        process.env['DEFENDER_PACKAGES_DIRECTORY'] = packagesDirectory;
        if (!process.env['DEFENDER_FILEPATH']) {
            const cliVersion = resolveCliVersion();
            core.debug(`Installing Defender CLI version: ${cliVersion}`);
            yield installer.install(cliVersion);
        }
    });
}
exports.setupEnvironment = setupEnvironment;
function resolveCliVersion() {
    let version = process.env['DEFENDER_VERSION'] || 'latest';
    if (version.includes('*')) {
        version = 'Latest';
    }
    core.debug(`Resolved Defender CLI version: ${version}`);
    return version;
}
function getCliFilePath() {
    return process.env['DEFENDER_FILEPATH'];
}
