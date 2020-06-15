import * as path from 'path';
import * as process from 'process';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as mscaVariables from './msca-variables'

export class MscaAction {

    constructor() { }

    async analyze() {
        const analyzeCommand = 'analyze'
        this.run(analyzeCommand);
    }

    async break() {
        const breakCommand = 'break';
        this.run(breakCommand);
    }

    async export() {
        const reportCommand = 'export';
        this.run(reportCommand);
    }

    async publish() {
        const publishCommand = 'publish';
        this.run(publishCommand);
    }

    async run(actionCommand: string, failTask: boolean = true) {

        const actionDirectory = path.resolve(__dirname);
        core.debug(`dirname = ${__dirname}`);

        mscaVariables.setup(actionDirectory);

        core.debug('Running Microsoft Security Code Analysis...');

        let integrationCliFilePath = process.env.MSCAI_FILEPATH;
        core.debug(`integrationCliFilePath = ${integrationCliFilePath}`);

        let args = ['run']

        if (failTask) {
            args.push('--logger-actions')
        }
        
        if (core.isDebug()) {
            args.push('--logger-level');
            args.push('trace');
        }

        try {
            await exec.exec('<toolPath>', args)
        }
        catch (error) {
            core.setFailed(error.Message);
        }
    }
}