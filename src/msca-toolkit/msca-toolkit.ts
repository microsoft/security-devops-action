import * as path from 'path';
import * as process from 'process';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as mscaVariables from './msca-variables'

export class MscaAction {
    integrationCliVersion: string = '1.*';

    constructor() { }

    async setupEnvironment(actionDirectory: string) {

        // Setup Integration Variables
        mscaVariables.setup(actionDirectory);

        console.log('------------------------------------------------------------------------------');

        if (!process.env.MSCAI_DIRECTORY && !process.env.MSCAI_FILEPATH) {
            let integrationCliVersion = this.resolveIntegrationCliVersion();
            let mscaInstaller = new MscaInstaller();
            await mscaInstaller.install(integrationCliVersion);
        }

        console.log('------------------------------------------------------------------------------');
    }

    resolveIntegrationCliVersion() : string {
        let integrationCliVersion = this.integrationCliVersion;

        if (process.env.MSCAI_VERSION) {
            integrationCliVersion = process.env.MSCAI_VERSION;
        }

        return integrationCliVersion;
    }

    async analyze() {
        this.run('analyze');
    }

    async break() {
        const breakCommand = ;
        this.run('break');
    }

    async export() {
        const reportCommand = ;
        this.run('export');
    }

    async publish() {
        this.run('publish');
    }

    async run() {
        const runCommand = 'run';
        this.run('run');
    }

    async run(actionCommand: string, failTask: boolean = true) {

        const actionDirectory = path.resolve(__dirname);
        core.debug(`dirname = ${__dirname}`);

        await this.setupEnvironment(actionDirectory);

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

        core.debug('Running Microsoft Security Code Analysis...');

        try {
            await exec.exec(integrationCliFilePath, args)
        }
        catch (error) {
            core.setFailed(error.Message);
        }
    }
}