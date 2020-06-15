import * as path from 'path';
import * as process from 'process';
import * as actionsCore from '@actions/core';
import * as actionsExec from '@actions/exec';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as mscaVariables from './msca-variables'

export class MscaAction {

    constructor(private core: typeof actionsCore, private exec: typeof actionsExec) { }

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
        this.core.debug(`dirname = ${__dirname}`);

        mscaVariables.setup(actionDirectory);

        tl.debug('Running Microsoft Security Code Analysis...');

        let integrationCliFilePath = process.env.MSCAI_FILEPATH;
        this.core.debug(`integrationCliFilePath = ${integrationCliFilePath}`);

        let args = ['run']

        if (failTask) {
            args += '--logger-actions'
        }

        // TODO:
        let systemDebug = false;

        if (systemDebug) {
            args += '--logger-level';
            args += 'trace';
        }

        try {
            await this.exec.exec('<toolPath>', args)
        }
        catch (error) {
            this.core.setFailed(error.Message);
        }
    }
}