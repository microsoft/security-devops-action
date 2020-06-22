import * as core from '@actions/core';
import { MscaAction } from './msca-toolkit/msca-toolkit';
import * as path from 'path';

let action = new MscaAction();

let args: string[] = [];

let config = core.getInput('config');
if (!action.isNullOrWhiteSpace(config)) {
    args.push('-c');
    args.push(config);
}

let policy = core.getInput('policy');
if (action.isNullOrWhiteSpace(policy)) {
    // Use the local policy file
    const actionDirectory = path.resolve(__dirname);
    core.debug(`actionDirectory = ${actionDirectory}`);

    const policyFilePath = path.resolve(path.join(actionDirectory, '../', 'policy', 'github.gdnpolicy'));
    core.debug(`policyFilePath = ${policyFilePath}`);

    args.push('--policy-file-path');
    args.push(policyFilePath);
} else {
    // Use the defined policy
    args.push('-p');
    args.push(policy);
}

action.run(args);