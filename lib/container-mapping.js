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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.ContainerMapping = void 0;
const https = __importStar(require("https"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const os = __importStar(require("os"));
const SEND_REPORT_RETRY_COUNT = 1;
const REQUEST_TIMEOUT_MS = 2500;
const PRE_JOB_FALLBACK_OFFSET_MS = 10000;
const GetScanContextURL = "https://dfdinfra-afdendpoint-prod-d5fqbucbg7fue0cf.z01.azurefd.net/github/v1/auth-push/GetScanContext?context=authOnly";
const ContainerMappingURL = "https://dfdinfra-afdendpoint-prod-d5fqbucbg7fue0cf.z01.azurefd.net/github/v1/container-mappings";
class ContainerMapping {
    constructor() {
        this.succeedOnError = true;
    }
    runPreJob() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                core.info("::group::Microsoft Defender for DevOps container mapping pre-job - https://go.microsoft.com/fwlink/?linkid=2231419");
                this._runPreJob();
            }
            catch (error) {
                core.warning(`Error in Container Mapping pre-job: ${error}`);
            }
            finally {
                core.info("::endgroup::");
            }
        });
    }
    _runPreJob() {
        const startTime = new Date().toISOString();
        core.saveState('PreJobStartTime', startTime);
        core.info(`PreJobStartTime: ${startTime}`);
    }
    runMain() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    runPostJob() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                core.info("::group::Microsoft Defender for DevOps container mapping post-job - https://go.microsoft.com/fwlink/?linkid=2231419");
                yield this._runPostJob();
            }
            catch (error) {
                core.warning(`Error in Container Mapping post-job: ${error}`);
            }
            finally {
                core.info("::endgroup::");
            }
        });
    }
    _runPostJob() {
        return __awaiter(this, void 0, void 0, function* () {
            let startTime = core.getState('PreJobStartTime');
            if (startTime.length <= 0) {
                startTime = new Date(new Date().getTime() - PRE_JOB_FALLBACK_OFFSET_MS).toISOString();
                core.debug(`PreJobStartTime not defined, using now-10secs`);
            }
            core.info(`PreJobStartTime: ${startTime}`);
            let reportData = {
                dockerVersion: "",
                dockerEvents: [],
                dockerImages: []
            };
            let bearerToken = yield core.getIDToken()
                .then((token) => { return token; })
                .catch((error) => {
                throw new Error(`Unable to get OIDC token. Ensure the workflow has 'id-token: write' permission. Details: ${error}`);
            });
            if (!bearerToken) {
                throw new Error("Empty OIDC token received. Ensure the workflow has 'id-token: write' permission.");
            }
            var callerIsOnboarded = yield this.checkCallerIsCustomer(bearerToken, SEND_REPORT_RETRY_COUNT);
            if (!callerIsOnboarded) {
                core.warning("Client is not onboarded to Defender for DevOps. Skipping container mapping workload.");
                return;
            }
            core.info("Client is onboarded for container mapping.");
            let dockerVersionOutput = yield exec.getExecOutput('docker --version');
            if (dockerVersionOutput.exitCode !== 0) {
                core.warning(`Docker not found or not available. Skipping container mapping. Exit code: ${dockerVersionOutput.exitCode}`);
                return;
            }
            reportData.dockerVersion = dockerVersionOutput.stdout.trim();
            yield this.execCommand(`docker events --since ${startTime} --until ${new Date().toISOString()} --filter event=push --filter type=image --format ID={{.ID}}`, reportData.dockerEvents)
                .catch((error) => {
                throw new Error(`Unable to get docker events: ${error}`);
            });
            yield this.execCommand(`docker images --format CreatedAt={{.CreatedAt}}::Repo={{.Repository}}::Tag={{.Tag}}::Digest={{.Digest}}`, reportData.dockerImages)
                .catch((error) => {
                throw new Error(`Unable to get docker images: ${error}`);
            });
            core.debug("Finished data collection, starting API calls.");
            var reportSent = yield this.sendReport(JSON.stringify(reportData), bearerToken, SEND_REPORT_RETRY_COUNT);
            if (!reportSent) {
                throw new Error("Unable to send report to backend service");
            }
            ;
            core.info("Container mapping data sent successfully.");
        });
    }
    execCommand(command, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            return exec.getExecOutput(command)
                .then((result) => {
                if (result.exitCode !== 0) {
                    return Promise.reject(`Command execution failed: ${result}`);
                }
                result.stdout.trim().split(os.EOL).forEach(element => {
                    if (element.length > 0) {
                        listener.push(element);
                    }
                });
            });
        });
    }
    sendReport(data_1, bearerToken_1) {
        return __awaiter(this, arguments, void 0, function* (data, bearerToken, retryCount = 0) {
            core.debug(`attempting to send report: ${data}`);
            return yield this._sendReport(data, bearerToken)
                .then(() => {
                return true;
            })
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                if (retryCount === 0) {
                    return false;
                }
                else {
                    core.info(`Retrying API call due to error: ${error}.\nRetry count: ${retryCount}`);
                    retryCount--;
                    return yield this.sendReport(data, bearerToken, retryCount);
                }
            }));
        });
    }
    _sendReport(data, bearerToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiStartTime = new Date().getTime();
            const options = {
                method: 'POST',
                timeout: REQUEST_TIMEOUT_MS,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Length': data.length
                }
            };
            core.debug(`${options.method} ${ContainerMappingURL}`);
            return new Promise((resolve, reject) => {
                const req = https.request(ContainerMappingURL, options, (res) => {
                    let resData = '';
                    res.on('data', (chunk) => {
                        resData += chunk.toString();
                    });
                    res.on('end', () => {
                        const elapsed = new Date().getTime() - apiStartTime;
                        core.debug(`API calls finished. Time taken: ${elapsed}ms`);
                        core.debug(`Status code: ${res.statusCode} ${res.statusMessage}`);
                        core.debug(`Response headers: ${JSON.stringify(res.headers)}`);
                        if (resData.length > 0) {
                            core.debug(`Response: ${resData}`);
                        }
                        if (res.statusCode < 200 || res.statusCode >= 300) {
                            return reject(`Received Failed Status code when calling url: ${res.statusCode} ${resData}`);
                        }
                        resolve();
                    });
                });
                req.on('error', (error) => {
                    reject(new Error(`Error calling url: ${error}`));
                });
                req.write(data);
                req.end();
            });
        });
    }
    checkCallerIsCustomer(bearerToken_1) {
        return __awaiter(this, arguments, void 0, function* (bearerToken, retryCount = 0) {
            return yield this._checkCallerIsCustomer(bearerToken)
                .then((statusCode) => __awaiter(this, void 0, void 0, function* () {
                if (statusCode === 200) {
                    return true;
                }
                else if (statusCode === 403) {
                    return false;
                }
                else {
                    core.debug(`Unexpected status code: ${statusCode}`);
                    return yield this.retryCall(bearerToken, retryCount);
                }
            }))
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                core.info(`Unexpected error: ${error}.`);
                return yield this.retryCall(bearerToken, retryCount);
            }));
        });
    }
    retryCall(bearerToken, retryCount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (retryCount === 0) {
                core.info(`All retries failed.`);
                return false;
            }
            else {
                core.info(`Retrying checkCallerIsCustomer.\nRetry count: ${retryCount}`);
                retryCount--;
                return yield this.checkCallerIsCustomer(bearerToken, retryCount);
            }
        });
    }
    _checkCallerIsCustomer(bearerToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                method: 'GET',
                timeout: REQUEST_TIMEOUT_MS,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${bearerToken}`,
                }
            };
            core.debug(`${options.method} ${GetScanContextURL}`);
            return new Promise((resolve, reject) => {
                const req = https.request(GetScanContextURL, options, (res) => {
                    res.on('end', () => {
                        resolve(res.statusCode);
                    });
                    res.on('data', () => {
                    });
                });
                req.on('error', (error) => {
                    reject(new Error(`Error calling url: ${error}`));
                });
                req.end();
            });
        });
    }
}
exports.ContainerMapping = ContainerMapping;
