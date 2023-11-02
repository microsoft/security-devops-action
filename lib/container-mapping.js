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
exports.ContainerMapping = void 0;
const https = __importStar(require("https"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const os = __importStar(require("os"));
const sendReportRetryCount = 1;
class ContainerMapping {
    constructor() {
        this.succeedOnError = true;
    }
    runPreJob() {
        try {
            core.info("::group::Microsoft Defender for DevOps container mapping pre-job - https://go.microsoft.com/fwlink/?linkid=2231419");
            this._runPreJob();
        }
        catch (error) {
            core.info("Error in Container Mapping pre-job: " + error);
        }
        finally {
            core.info("::endgroup::");
        }
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
                core.info("Error in Container Mapping post-job: " + error);
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
                startTime = new Date(new Date().getTime() - 10000).toISOString();
                core.debug(`PreJobStartTime not defined, using now-10secs`);
            }
            core.info(`PreJobStartTime: ${startTime}`);
            let reportData = {
                dockerVersion: "",
                dockerEvents: [],
                dockerImages: []
            };
            let dockerVersionOutput = yield exec.getExecOutput('docker --version');
            if (dockerVersionOutput.exitCode != 0) {
                core.info(`Unable to get docker version: ${dockerVersionOutput}`);
                core.info(`Skipping container mapping since docker not found/available.`);
                return;
            }
            reportData.dockerVersion = dockerVersionOutput.stdout.trim();
            yield this.execCommand(`docker events --since ${startTime} --until ${new Date().toISOString()} --filter event=push --filter type=image --format ID={{.ID}}`, reportData.dockerEvents)
                .catch((error) => {
                throw new Error("Unable to get docker events: " + error);
            });
            yield this.execCommand(`docker images --format CreatedAt={{.CreatedAt}}::Repo={{.Repository}}::Tag={{.Tag}}::Digest={{.Digest}}`, reportData.dockerImages)
                .catch((error) => {
                throw new Error("Unable to get docker images: " + error);
            });
            core.debug("Finished data collection, starting API calls.");
            let bearerToken = yield core.getIDToken()
                .then((token) => { return token; })
                .catch((error) => {
                throw new Error("Unable to get token: " + error);
            });
            if (!bearerToken) {
                throw new Error("Empty OIDC token received");
            }
            var reportSent = yield this.sendReport(JSON.stringify(reportData), bearerToken, sendReportRetryCount);
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
                if (result.exitCode != 0) {
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
    sendReport(data, bearerToken, retryCount = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`attempting to send report: ${data}`);
            return yield this._sendReport(data, bearerToken)
                .then(() => {
                return true;
            })
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                if (retryCount == 0) {
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
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let apiTime = new Date().getMilliseconds();
                let url = "https://dfdinfra-afdendpoint-prod-d5fqbucbg7fue0cf.z01.azurefd.net/github/v1/container-mappings";
                let options = {
                    method: 'POST',
                    timeout: 2500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + bearerToken,
                        'Content-Length': data.length
                    }
                };
                core.debug(`${options['method'].toUpperCase()} ${url}`);
                const req = https.request(url, options, (res) => {
                    let resData = '';
                    res.on('data', (chunk) => {
                        resData += chunk.toString();
                    });
                    res.on('end', () => {
                        core.debug('API calls finished. Time taken: ' + (new Date().getMilliseconds() - apiTime) + "ms");
                        core.debug(`Status code: ${res.statusCode} ${res.statusMessage}`);
                        core.debug('Response headers: ' + JSON.stringify(res.headers));
                        if (resData.length > 0) {
                            core.debug('Response: ' + resData);
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
            }));
        });
    }
}
exports.ContainerMapping = ContainerMapping;
