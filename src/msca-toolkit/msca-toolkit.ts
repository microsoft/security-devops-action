import * as path from 'path';
import * as process from 'process';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { MscaInstaller } from './msca-installer'

export class MscaAction {
    cliVersion: string = '0.*';
    constructor() { }

    async setupEnvironment() {

        console.log('------------------------------------------------------------------------------');

        if (!process.env.MSCA_FILEPATH) {
            let cliVersion = this.resolveCliVersion();
            let mscaInstaller = new MscaInstaller();
            await mscaInstaller.install(cliVersion);
        }

        console.log('------------------------------------------------------------------------------');
    }

    resolveCliVersion() : string {
        let cliVersion = this.cliVersion;

        if (process.env.MSCA_VERSION) {
            cliVersion = process.env.MSCA_VERSION;
        }

        return cliVersion;
    }

    isNullOrWhiteSpace(value: string) {
        return !value || !value.trim();
    }

    async run(args: array) {

        await this.setupEnvironment();

        let integrationCliFilePath = process.env.MSCA_FILEPATH;
        core.debug(`integrationCliFilePath = ${integrationCliFilePath}`);

        if (args == null) {
            args = ['run'];
        }

        args.push('--logger-actions');

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