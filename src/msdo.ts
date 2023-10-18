import * as core from '@actions/core';
import { CommandType } from './msdo-helpers';
import { IMicrosoftSecurityDevOps } from './msdo-interface';
import * as client from '@microsoft/security-devops-actions-toolkit/msdo-client';
import * as common from '@microsoft/security-devops-actions-toolkit/msdo-common';

/*
* Microsoft Security DevOps analyzers runner.
*/
export class MicrosoftSecurityDevOps implements IMicrosoftSecurityDevOps {
    private readonly commandType: CommandType;
    readonly succeedOnError: boolean;

    constructor(commandType: CommandType) {
        this.succeedOnError = false;
        this.commandType = commandType;
    }

    private async runMsdo() {
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
            let languages = languagesString.split(',');
            args.push('--languages');
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

    /*
    * Run the specified function based on the task type
    */
    async run() {
        switch (this.commandType) {
            case CommandType.Run:
                await this.runMsdo();
                break;
            default:
                throw new Error(`Invalid command type: ${this.commandType}`);
        }
    }
}