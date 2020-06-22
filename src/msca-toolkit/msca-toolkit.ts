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

    isNullOrWhiteSpace(value: string) : boolean {
        return !value || !value.trim();
    }

    async init() {

        let cliFilePath: string = process.env.MSCA_FILEPATH;
        core.debug(`cliFilePath = ${cliFilePath}`);

        try {
            await exec.exec(cliFilePath, ['init', '--force']);
        }
        catch (error) {
            core.debug(error.Message);
        }
    }

    async run(inputArgs: string[]) {

        await this.setupEnvironment();

        await this.init();

        let cliFilePath: string = process.env.MSCA_FILEPATH;
        core.debug(`cliFilePath = ${cliFilePath}`);

        let args = ['run'];

        if (inputArgs != null)
        {
            for (let i = 0; i < inputArgs.length; i++)
            {
                args.push(inputArgs[i]);
            }
        }

        args.push('--not-break-on-detections');

        if (core.isDebug()) {
            args.push('--logger-level');
            args.push('trace');
        }

        let sarifFile : string = path.join(process.env.GITHUB_WORKSPACE, '.gdn', 'msca.sarif');
        core.debug(`sarifFile = ${sarifFile}`);

        // Write it as a GitHub Action variable for follow up tasks to consume
        core.exportVariable('MSCA_SARIF_FILE', sarifFile);
        core.setOutput('sarifFile', sarifFile);

        args.push('--export-breaking-results-to-file');
        args.push(`${sarifFile}`);

        core.debug('Running Microsoft Security Code Analysis...');

        try {
            await exec.exec(cliFilePath, args);
        }
        catch (error) {
            core.setFailed(error.Message);
        }
    }
}