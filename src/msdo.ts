import * as core from '@actions/core';
import { IMicrosoftSecurityDevOps } from './msdo-interface';
import { Tools } from './msdo-helpers';
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

        let config: string = core.getInput('config');
        if (!common.isNullOrWhiteSpace(config)) {
            args.push('-c');
            args.push(config);
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
            for (let i = 0; i < languages.length; i++) {
                let language = languages[i];
                if (!common.isNullOrWhiteSpace(language)) {
                    args.push(language.trim());
                }
            }
        }

        let toolsString: string = core.getInput('tools');
        let includedTools = [];
        if (!common.isNullOrWhiteSpace(toolsString)) {
            let tools = toolsString.split(',');
            for (let i = 0; i < tools.length; i++) {
                let tool = tools[i];
                let toolTrimmed = tool.trim();
                if (!common.isNullOrWhiteSpace(tool)
                    && tool != Tools.ContainerMapping
                    && includedTools.indexOf(toolTrimmed) == -1) {
                    if (includedTools.length == 0) {
                        args.push('--tool');
                    }
                    args.push(toolTrimmed);
                    includedTools.push(toolTrimmed);
                }
            }
        }
        
        let includeToolsString: string = core.getInput('includeTools');
        if (!common.isNullOrWhiteSpace(includeToolsString)) {
            let includeTools = includeToolsString.split(',');
            for (let i = 0; i < includeTools.length; i++) {
                let includeTool = includeTools[i];
                let toolTrimmed = includeTool.trim();
                if (!common.isNullOrWhiteSpace(includeTool)
                    && includeTool != Tools.ContainerMapping
                    && includedTools.indexOf(toolTrimmed) == -1) {
                    if (includedTools.length == 0) {
                        args.push('--tool');
                    }
                    args.push(toolTrimmed);
                    includedTools.push(toolTrimmed);
                }
            }
        }

        args.push('--github');

        await client.run(args, 'microsoft/security-devops-action');
    }
}