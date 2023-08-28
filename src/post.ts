import * as core from '@actions/core';
import * as exec from '@actions/exec';
import fetch from "node-fetch";

async function run() {
    let startTime = core.getState('PreJobStartTime');
    if (startTime.length <= 0) {
        console.log(`PreJobStartTime not defined, using now-10secs `);
        startTime = new Date(new Date().getTime() - 10000).toISOString();
    }

        let dockerVer = Buffer.alloc(0);
        let dokcerEvents = Buffer.alloc(0);
        let dockerImages = Buffer.alloc(0);
        
        // Initialize the commands 
        await exec.exec('docker --version', null, {
            listeners: {
                stdout: (data: Buffer) => {
                    dockerVer = Buffer.concat([dockerVer, data]);
                }
            }
        });
        await exec.exec(`docker events --since ${startTime} --until ${new Date().toISOString()} --filter event=push --filter type=image --format ID={{.ID}}`, null, {
            listeners: {
                stdout: (data: Buffer) => {
                    dokcerEvents = Buffer.concat([dokcerEvents, data]);
                }
            }
        });
        await exec.exec('docker images --format CreatedAt={{.CreatedAt}}::Repo={{.Repository}}::Tag={{.Tag}}::Digest={{.Digest}}', null, {
            listeners: {
                stdout: (data: Buffer) => {
                    dockerImages = Buffer.concat([dockerImages, data]);
                }
            }
        });

        // Post data to URI
        let data = {
            dockerVer: dockerVer.toString(),
            dokcerEvents: dokcerEvents.toString(),
            dockerImages: dockerImages.toString()
        };

        let apiTime = new Date().getMilliseconds();
        console.log("Finished data collection, starting API calls.");
        
        const url: string = "https://larohratestfd-gsffakahdhdyafhx.z01.azurefd.net/oidc/HelloFunction?code=";
        var key = core.getInput('OIDC_TEST_KEY');
        if (key.length <= 0) {
            throw new Error(`OIDC_TEST_KEY not defined`);
        }

        var bearerToken = await core.getIDToken();

        fetch(url+key, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer '+bearerToken} 
        })
        .then((res) => {
            console.log(res);
            return res.text();
        })
        .then((text) => {
            console.log(text);
            console.log("API calls finished. Time taken: " + (new Date().getMilliseconds() - apiTime) + "ms");
        })
        .catch((err: any) => console.error('error:' + err));
}

function getOptions(buffer: Buffer): exec.ExecOptions {
    var options = {
        listeners: {
            stdout: (data: Buffer) => {
                buffer = Buffer.concat([buffer, data]);
                console.log("Buffer: " + buffer.toString());
            },
            stderr: (data: Buffer) => {
                buffer = Buffer.concat([buffer, data]);
            }
        }
    };
    return options;
}

run().catch((error) => {
    core.debug(error);
});