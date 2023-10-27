import * as core from '@actions/core';
import { CommandType } from './msdo-helpers';
import { IMicrosoftSecurityDevOps } from './msdo-interface';
import * as client from '@microsoft/security-devops-actions-toolkit/msdo-client';
import * as common from '@microsoft/security-devops-actions-toolkit/msdo-common';

/*
* Microsoft Security DevOps analyzers runner.
*/
export class MicrosoftSecurityDevOps implements IMicrosoftSecurityDevOps {
    readonly succeedOnError: boolean;

    constructor() {
        this.succeedOnError = false;
    }

    public async runPreJob() {
        // No pre-job commands yet
    }

    public async runPostJob() {
        // No post-job commands yet
    }

    public async runMain() {
        core.debug('MicrosoftSecurityDevOps.runMain - Running MSDO...');

        let args: string[] = ['run'];
        let scanEnabled: boolean = false;

        let config: string = core.getInput('config');
        if (!common.isNullOrWhiteSpace(config)) {
            args.push('-c');
            args.push(config);
            scanEnabled = true;
        }

        let policy: string = core.getInput('policy');
        if (common.isNullOrWhiteSpace(policy)) {
            policy = "GitHub";
        }

        args.push('-p');
        args.push(policy);

        let categoriesString: string = core.getInput('categories');
        if (!common.isNullOrWhiteSpace(categoriesString)) {
            args.push('--categories');
            let categories = categoriesString.split(',');
            if (!scanEnabled) {
                scanEnabled = categories.length > 0
            }
            for (let i = 0; i < categories.length; i++) {
                let category = categories[i];
                if (!common.isNullOrWhiteSpace(category)) {
                    args.push(category.trim());
                }
            }
        }

        let languagesString: string = core.getInput('languages');
        if (!common.isNullOrWhiteSpace(languagesString)) {
            args.push('--languages');
            let languages = languagesString.split(',');
            if (!scanEnabled) {
                scanEnabled = languages.length > 0
            }
            for (let i = 0; i < languages.length; i++) {
                let language = languages[i];
                if (!common.isNullOrWhiteSpace(language)) {
                    args.push(language.trim());
                }
            }
        }

        let toolsString: string = core.getInput('tools');
        if (!common.isNullOrWhiteSpace(toolsString)) {
            let tools = toolsString.split(',');
            const containerMappingIndex = tools.indexOf('container-mapping');
            if (containerMappingIndex > -1) {
                if (!scanEnabled && tools.length == 1) {
                    // Only container mapping is enabled
                    console.log("Scanning not enabled. Skipping...");
                    return;
                } else {
                    core.debug("Removing non-scanner container-mapping");
                    tools.splice(containerMappingIndex, 1);
                }
            }
        }

        let tools = [];
        if (tools.length > 0) {
            args.push('--tool');
            for (let i = 0; i < tools.length; i++) {
                let tool = tools[i];
                if (!common.isNullOrWhiteSpace(tool)) {
                    args.push(tool.trim());
                }
            }
        }

        args.push('--github');

        await client.run(args, 'microsoft/security-devops-action');
    }
}