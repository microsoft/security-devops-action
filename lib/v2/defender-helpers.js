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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAdditionalArgs = exports.getEncodedContent = exports.encode = exports.writeToOutStream = exports.setupDebugLogging = exports.validateImageName = exports.validateModelPath = exports.validateModelUrl = exports.isUrl = exports.validateFileSystemPath = exports.validateScanType = exports.Constants = exports.ScanType = exports.Inputs = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
var Inputs;
(function (Inputs) {
    Inputs["Command"] = "command";
    Inputs["Args"] = "args";
    Inputs["FileSystemPath"] = "fileSystemPath";
    Inputs["ImageName"] = "imageName";
    Inputs["ModelPath"] = "modelPath";
    Inputs["Break"] = "break";
    Inputs["Debug"] = "debug";
    Inputs["PrSummary"] = "pr-summary";
    Inputs["Policy"] = "policy";
})(Inputs || (exports.Inputs = Inputs = {}));
var ScanType;
(function (ScanType) {
    ScanType["FileSystem"] = "fs";
    ScanType["Image"] = "image";
    ScanType["Model"] = "model";
})(ScanType || (exports.ScanType = ScanType = {}));
var Constants;
(function (Constants) {
    Constants["Unknown"] = "unknown";
    Constants["PreJobStartTime"] = "PREJOBSTARTTIME";
    Constants["DefenderExecutable"] = "Defender";
})(Constants || (exports.Constants = Constants = {}));
function validateScanType(scanTypeInput) {
    const scanType = scanTypeInput;
    if (!Object.values(ScanType).includes(scanType)) {
        throw new Error(`Invalid scan type: ${scanTypeInput}. Valid options are: ${Object.values(ScanType).join(', ')}`);
    }
    return scanType;
}
exports.validateScanType = validateScanType;
function validateFileSystemPath(fsPath) {
    if (!fsPath || fsPath.trim() === '') {
        throw new Error('Filesystem path cannot be empty for filesystem scan');
    }
    const trimmedPath = fsPath.trim();
    if (!fs.existsSync(trimmedPath)) {
        throw new Error(`Filesystem path does not exist: ${trimmedPath}`);
    }
    return trimmedPath;
}
exports.validateFileSystemPath = validateFileSystemPath;
function isUrl(input) {
    if (!input) {
        return false;
    }
    const lowercased = input.toLowerCase();
    return lowercased.startsWith('http://') || lowercased.startsWith('https://');
}
exports.isUrl = isUrl;
function validateModelUrl(url) {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            throw new Error(`Invalid URL protocol: ${parsedUrl.protocol}. Only http:// and https:// are supported.`);
        }
        if (!parsedUrl.hostname) {
            throw new Error('URL must have a valid hostname.');
        }
        return url;
    }
    catch (error) {
        if (error instanceof TypeError) {
            throw new Error(`Invalid URL format: ${url}`);
        }
        throw error;
    }
}
exports.validateModelUrl = validateModelUrl;
function validateModelPath(modelPath) {
    if (!modelPath || modelPath.trim() === '') {
        throw new Error('Model path cannot be empty for model scan');
    }
    const trimmedPath = modelPath.trim();
    if (isUrl(trimmedPath)) {
        return validateModelUrl(trimmedPath);
    }
    if (!fs.existsSync(trimmedPath)) {
        throw new Error(`Model path does not exist: ${trimmedPath}`);
    }
    const stats = fs.statSync(trimmedPath);
    if (!stats.isFile() && !stats.isDirectory()) {
        throw new Error(`Model path must be a file or directory: ${trimmedPath}`);
    }
    return trimmedPath;
}
exports.validateModelPath = validateModelPath;
function validateImageName(imageName) {
    if (!imageName || imageName.trim() === '') {
        throw new Error('Image name cannot be empty for image scan');
    }
    const trimmedImageName = imageName.trim();
    const imageNameRegex = /^(?:(?:[a-zA-Z0-9._-]+(?:\.[a-zA-Z0-9._-]+)*(?::[0-9]+)?\/)?[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*)(?::[a-zA-Z0-9._-]+|@sha256:[a-fA-F0-9]{64})?$/;
    if (!imageNameRegex.test(trimmedImageName)) {
        throw new Error(`Invalid image name format: ${trimmedImageName}. Image name should follow container image naming conventions.`);
    }
    return trimmedImageName;
}
exports.validateImageName = validateImageName;
function setupDebugLogging(enabled) {
    if (enabled) {
        process.env['RUNNER_DEBUG'] = '1';
        core.debug('Debug logging enabled');
    }
}
exports.setupDebugLogging = setupDebugLogging;
function writeToOutStream(data, outStream = process.stdout) {
    outStream.write(data.trim() + os.EOL);
}
exports.writeToOutStream = writeToOutStream;
const encode = (str) => Buffer.from(str, 'binary').toString('base64');
exports.encode = encode;
function getEncodedContent(dockerVersion, dockerEvents, dockerImages) {
    let data = [];
    data.push('DockerVersion: ' + dockerVersion);
    data.push('DockerEvents:');
    data.push(dockerEvents);
    data.push('DockerImages:');
    data.push(dockerImages);
    return (0, exports.encode)(data.join(os.EOL));
}
exports.getEncodedContent = getEncodedContent;
function parseAdditionalArgs(additionalArgs) {
    if (!additionalArgs || additionalArgs.trim() === '') {
        return [];
    }
    const args = [];
    const trimmedArgs = additionalArgs.trim();
    const regex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
    const matches = trimmedArgs.match(regex);
    if (matches) {
        for (const match of matches) {
            let arg = match;
            if ((arg.startsWith('"') && arg.endsWith('"')) ||
                (arg.startsWith("'") && arg.endsWith("'"))) {
                arg = arg.slice(1, -1);
            }
            args.push(arg);
        }
    }
    core.debug(`Parsed additional arguments: ${JSON.stringify(args)}`);
    return args;
}
exports.parseAdditionalArgs = parseAdditionalArgs;
