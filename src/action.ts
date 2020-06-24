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
if (!action.isNullOrWhiteSpace(policy)) {
    args.push('-p');
    args.push(policy);
}

action.run(args);