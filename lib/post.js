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
exports._sendReport = exports.sendReport = exports.run = void 0;
const https = __importStar(require("https"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const sendReportRetryCount = 1;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let startTime = core.getState('PreJobStartTime');
        if (startTime.length <= 0) {
            console.log(`PreJobStartTime not defined, using now-10secs `);
            startTime = new Date(new Date().getTime() - 10000).toISOString();
        }
        let dockerVer = Buffer.alloc(0);
        let dockerEvents = Buffer.alloc(0);
        let dockerImages = Buffer.alloc(0);
        yield exec.exec('docker --version', null, {
            listeners: {
                stdout: (data) => {
                    dockerVer = Buffer.concat([dockerVer, data]);
                }
            }
        });
        yield exec.exec(`docker events --since ${startTime} --until ${new Date().toISOString()} --filter event=push --filter type=image --format ID={{.ID}}`, null, {
            listeners: {
                stdout: (data) => {
                    dockerEvents = Buffer.concat([dockerEvents, data]);
                }
            }
        });
        yield exec.exec('docker images --format CreatedAt={{.CreatedAt}}::Repo={{.Repository}}::Tag={{.Tag}}::Digest={{.Digest}}', null, {
            listeners: {
                stdout: (data) => {
                    dockerImages = Buffer.concat([dockerImages, data]);
                }
            }
        });
        let data = {
            dockerVer: dockerVer.toString(),
            dokcerEvents: dockerEvents.toString(),
            dockerImages: dockerImages.toString()
        };
        core.debug("Finished data collection, starting API calls.");
        yield sendReport(data, sendReportRetryCount);
    });
}
exports.run = run;
function sendReport(data, retryCount = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            do {
                try {
                    yield _sendReport(data);
                    resolve();
                    break;
                }
                catch (error) {
                    if (retryCount == 0) {
                        reject('Failed to send report: ' + error);
                    }
                    else {
                        retryCount--;
                        core.debug(`Retrying API call. Retry count: ${retryCount}`);
                    }
                }
            } while (retryCount >= 0);
        }));
    });
}
exports.sendReport = sendReport;
function _sendReport(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let apiTime = new Date().getMilliseconds();
            var bearerToken = yield core.getIDToken();
            let url = "https://dfdinfra-afdendpoint2-dogfood-edb5h5g7gyg7h3hq.z01.azurefd.net/github/v1/container-mappings";
            let options = {
                method: 'POST',
                timeout: 2500,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + bearerToken
                },
                data: data
            };
            core.debug(`${options['method'].toUpperCase()} ${url}`);
            const req = https.request(url, options, (res) => {
                let resData = '';
                res.on('data', (chunk) => {
                    resData += chunk.toString();
                });
                res.on('end', () => {
                    core.debug('API calls finished. Time taken: ' + (new Date().getMilliseconds() - apiTime) + "ms");
                    core.debug('Response: ' + resData);
                    resolve();
                });
            });
            req.on('error', (error) => {
                reject(new Error(`Error calling url: ${error}`));
            });
            req.end();
        }));
    });
}
exports._sendReport = _sendReport;
run().catch((error) => {
    core.debug(error);
});
