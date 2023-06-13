import * as core from '@actions/core';
import * as client from '@microsoft/security-devops-actions-toolkit/msdo-client';
import * as common from '@microsoft/security-devops-actions-toolkit/msdo-common';

async function run() {
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

run().catch((error) => core.setFailed(error));