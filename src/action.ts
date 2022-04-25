import * as core from '@actions/core';
import { MsdoClient } from 'microsoft-security-devops-actions-toolkit';
import * as path from 'path';

async function run() {
    let client = new MsdoClient();

    let args: string[] = ['run'];

    let config: string = core.getInput('config');
    if (!client.isNullOrWhiteSpace(config)) {
        args.push('-c');
        args.push(config);
    }

    let policy: string = core.getInput('policy');
    if (client.isNullOrWhiteSpace(policy)) {
        policy = "GitHub";
    }

    args.push('-p');
    args.push(policy);

    let categoriesString: string = core.getInput('categories');
    if (!client.isNullOrWhiteSpace(categoriesString)) {
        args.push('--categories');
        let categories = categoriesString.split(',');
        for (let i = 0; i < categories.length; i++) {
            let category = categories[i];
            if (!client.isNullOrWhiteSpace(category)) {
                args.push(category.trim());
            }
        }
    }

    let languagesString: string = core.getInput('languages');
    if (!client.isNullOrWhiteSpace(languagesString)) {
        let languages = languagesString.split(',');
        args.push('--languages');
        for (let i = 0; i < languages.length; i++) {
            let language = languages[i];
            if (!client.isNullOrWhiteSpace(language)) {
                args.push(language.trim());
            }
        }
    }

    let toolsString: string = core.getInput('tools');
    if (!client.isNullOrWhiteSpace(toolsString)) {
        let tools = toolsString.split(',');
        args.push('--tool');
        for (let i = 0; i < tools.length; i++) {
            let tool = tools[i];
            if (!client.isNullOrWhiteSpace(tool)) {
                args.push(tool.trim());
            }
        }
    }

    args.push('--github');

    await client.run(args, 'microsoft/security-devops-action');
}

run().catch((error) => core.setFailed(error));