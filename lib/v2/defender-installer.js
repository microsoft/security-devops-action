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
exports.setVariables = exports.resolveFileName = exports.install = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const downloadBaseUrl = 'https://cli.dfd.security.azure.com/public';
const maxRetries = 3;
const downloadTimeoutMs = 30000;
function install(cliVersion = 'latest') {
    return __awaiter(this, void 0, void 0, function* () {
        const existingPath = process.env['DEFENDER_FILEPATH'];
        if (existingPath && fs.existsSync(existingPath)) {
            core.debug(`Defender CLI already installed at: ${existingPath}`);
            return;
        }
        const existingDir = process.env['DEFENDER_DIRECTORY'];
        if (existingDir && fs.existsSync(existingDir)) {
            const fileName = resolveFileName();
            const filePath = path.join(existingDir, fileName);
            if (fs.existsSync(filePath)) {
                core.debug(`Found pre-installed Defender CLI at: ${filePath}`);
                setVariables(existingDir, fileName, cliVersion);
                return;
            }
        }
        const toolCacheDir = process.env['RUNNER_TOOL_CACHE'] || path.join(os.homedir(), '.defender');
        const packagesDirectory = process.env['DEFENDER_PACKAGES_DIRECTORY'] || path.join(toolCacheDir, '_defender', 'packages');
        if (!fs.existsSync(packagesDirectory)) {
            fs.mkdirSync(packagesDirectory, { recursive: true });
        }
        const fileName = resolveFileName();
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                core.info(`Downloading Defender CLI (attempt ${attempt}/${maxRetries})...`);
                yield downloadDefenderCli(packagesDirectory, fileName, cliVersion);
                setVariables(packagesDirectory, fileName, cliVersion, true);
                core.info(`Defender CLI installed successfully.`);
                return;
            }
            catch (error) {
                lastError = error;
                core.warning(`Download attempt ${attempt} failed: ${lastError.message}`);
                if (attempt < maxRetries) {
                    core.info('Retrying...');
                }
            }
        }
        throw new Error(`Failed to install Defender CLI after ${maxRetries} attempts: ${lastError === null || lastError === void 0 ? void 0 : lastError.message}`);
    });
}
exports.install = install;
function downloadDefenderCli(packagesDirectory, fileName, cliVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const versionDir = path.join(packagesDirectory, `defender-cli.${cliVersion}`);
        if (!fs.existsSync(versionDir)) {
            fs.mkdirSync(versionDir, { recursive: true });
        }
        const filePath = path.join(versionDir, fileName);
        const downloadUrl = `${downloadBaseUrl}/${cliVersion.toLowerCase()}/${fileName}`;
        core.debug(`Downloading from: ${downloadUrl}`);
        core.debug(`Saving to: ${filePath}`);
        yield downloadFile(downloadUrl, filePath);
        if (process.platform !== 'win32') {
            fs.chmodSync(filePath, 0o755);
        }
    });
}
function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        const request = https.get(url, { timeout: downloadTimeoutMs }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(filePath);
                const redirectUrl = response.headers.location;
                if (!redirectUrl) {
                    return reject(new Error('Redirect without location header'));
                }
                core.debug(`Following redirect to: ${redirectUrl}`);
                downloadFile(redirectUrl, filePath).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(filePath);
                return reject(new Error(`Download failed with status code: ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
        request.on('error', (error) => {
            file.close();
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            reject(new Error(`Download error: ${error.message}`));
        });
        request.on('timeout', () => {
            request.destroy();
            file.close();
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            reject(new Error('Download timed out'));
        });
    });
}
function resolveFileName() {
    const platform = os.platform();
    const arch = os.arch();
    switch (platform) {
        case 'win32':
            if (arch === 'arm64')
                return 'Defender_win-arm64.exe';
            if (arch === 'ia32' || arch === 'x32')
                return 'Defender_win-x86.exe';
            return 'Defender_win-x64.exe';
        case 'linux':
            if (arch === 'arm64')
                return 'Defender_linux-arm64';
            return 'Defender_linux-x64';
        case 'darwin':
            if (arch === 'arm64')
                return 'Defender_osx-arm64';
            return 'Defender_osx-x64';
        default:
            core.warning(`Unknown platform: ${platform}. Defaulting to linux-x64.`);
            return 'Defender_linux-x64';
    }
}
exports.resolveFileName = resolveFileName;
function setVariables(packagesDirectory, fileName, cliVersion, validate = false) {
    const defenderDir = path.join(packagesDirectory, `defender-cli.${cliVersion}`);
    const defenderFilePath = path.join(defenderDir, fileName);
    if (validate && !fs.existsSync(defenderFilePath)) {
        throw new Error(`Defender CLI not found after download: ${defenderFilePath}`);
    }
    process.env['DEFENDER_DIRECTORY'] = defenderDir;
    process.env['DEFENDER_FILEPATH'] = defenderFilePath;
    process.env['DEFENDER_INSTALLEDVERSION'] = cliVersion;
    core.debug(`DEFENDER_DIRECTORY=${defenderDir}`);
    core.debug(`DEFENDER_FILEPATH=${defenderFilePath}`);
    core.debug(`DEFENDER_INSTALLEDVERSION=${cliVersion}`);
}
exports.setVariables = setVariables;
