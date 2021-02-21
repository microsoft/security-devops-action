import * as core from '@actions/core';
import { MscaClient } from 'msca-actions-toolkit';
import * as path from 'path';

async function run() {
    let client = new MscaClient();

    let args: string[] = ['run'];

    let config = core.getInput('config');
    if (!client.isNullOrWhiteSpace(config)) {
        args.push('-c');
        args.push(config);
    }

    let policy = core.getInput('policy');
    if (!client.isNullOrWhiteSpace(policy)) {
        args.push('-p');
        args.push(policy);
    }

    await client.run(args);
}

run().catch((error) => core.setFailed(error));