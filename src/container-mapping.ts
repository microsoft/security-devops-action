import { CommandType, Constants, getEncodedContent, writeToOutStream } from "./msdo-helpers";
import { IMicrosoftSecurityDevOps } from "./msdo-interface";
import * as https from "https";
import * as core from '@actions/core';
import * as exec from '@actions/exec';

const sendReportRetryCount: number = 1;

/**
 * Represents the tasks for container mapping that are used to fetch Docker images pushed in a job run.
 */
export class ContainerMapping implements IMicrosoftSecurityDevOps {
    readonly succeedOnError: boolean;

    constructor() {
        this.succeedOnError = true;
    }

    /**
     * Container mapping pre-job commands wrapped in exception handling.
     */
    public runPreJob() {
        this.run(this._runPreJob);
    }

    /*
    * Set the start time of the job run.
    */
    private _runPreJob() {
        const startTime = new Date().toISOString();
        core.saveState('PreJobStartTime', startTime);
        console.log('PreJobStartTime', startTime);
    }

    /**
     * Placeholder / interface satisfier for main operations
     */
    public async runMain() {
        // No commands
    }

    /**
     * Container mapping post-job commands wrapped in exception handling.
     */
    public async runPostJob() {
        this.run(this._runPostJob);
    }

    /*
    * Using the start time, fetch the docker events and docker images in this job run and log the encoded output
    * Send the report to Defender for DevOps
    */
    public async _runPostJob() {
        let startTime = core.getState('PreJobStartTime');
        if (startTime.length <= 0) {
            startTime = new Date(new Date().getTime() - 10000).toISOString();
            console.log(`PreJobStartTime not defined, using now-10secs`);
        }
        console.log(`PreJobStartTime: ${startTime}`);

        let reportData = {
            dockerVer: "",
            dockerEvents: "",
            dockerImages: ""
        };
        
        // Initialize the commands 
        await exec.exec('docker --version', null, {
            listeners: {
                stdout: (data: Buffer) => {
                    reportData.dockerVer = reportData.dockerVer.concat(data.toString());
                }
            }
        });
        await exec.exec(`docker events --since ${startTime} --until ${new Date().toISOString()} --filter event=push --filter type=image --format ID={{.ID}}`, null, {
            listeners: {
                stdout: (data: Buffer) => {
                    reportData.dockerEvents = reportData.dockerEvents.concat(data.toString());
                }
            }
        });
        await exec.exec('docker images --format CreatedAt={{.CreatedAt}}::Repo={{.Repository}}::Tag={{.Tag}}::Digest={{.Digest}}', null, {
            listeners: {
                stdout: (data: Buffer) => {
                    reportData.dockerImages = reportData.dockerImages.concat(data.toString());
                }
            }
        });

        core.debug("Finished data collection, starting API calls.");

        await this.sendReport(reportData, sendReportRetryCount);
    }

    /**
     * Sends a report to Defender for DevOps and retries on the specified count
     * @param data the data to send
     * @param retryCount the number of time to retry
     * @returns a Promise
     */
    private async sendReport(data: Object, retryCount: number = 0): Promise<void> {
        return new Promise(async (resolve, reject) => {
            do {
                try {
                    await this._sendReport(data);
                    resolve();
                    break;
                } catch (error) {
                    if (retryCount == 0) {
                        reject('Failed to send report: ' + error);
                    } else {
                        retryCount--;
                        core.debug(`Retrying API call. Retry count: ${retryCount}`);
                    }
                }
            } while (retryCount >= 0)
        });
    }
    
    /**
     * Sends a report to Defender for DevOps
     * @param data the data to send
     * @returns a Promise
     */
    private async _sendReport(data: Object): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let apiTime = new Date().getMilliseconds();
            var bearerToken = await core.getIDToken();
            let url: string = "https://dfdinfra-afdendpoint2-dogfood-edb5h5g7gyg7h3hq.z01.azurefd.net/github/v1/container-mappings";
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
        });
    }

    /*
    * Run the specified function based on the task type
    */
    private async run(action) {
        try {
            action();
        }
        catch (error) {
            // Log the error
            writeToOutStream("Error in Container Mapping: " + error);
        }
        finally {
            // End the collapsible section
            writeToOutStream("##[endgroup]");
        }
    }
}