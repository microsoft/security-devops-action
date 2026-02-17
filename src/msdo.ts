import * as core from '@actions/core';
import * as exec from '@actions/exec';
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

        let args: string[] = undefined;

        // Check job type - might be existing file
        let existingFilename = core.getInput('existingFilename');
        if (!common.isNullOrWhiteSpace(existingFilename)) {
            args = ['upload', '--file', existingFilename];
        }

        // Nope, run the tool as intended
        else {
            args = ['run'];

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
                        && tool != Tools.ContainerMapping // This tool is not handled by this executor
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
        }

        let subscriptionId: string = core.getInput('subscriptionId');
        let tenantId: string = core.getInput('tenantId');

        // Auto-infer from common Azure env vars if not explicitly provided
        if (common.isNullOrWhiteSpace(subscriptionId)) {
            subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || '';
        }
        if (common.isNullOrWhiteSpace(tenantId)) {
            tenantId = process.env.AZURE_TENANT_ID || '';
        }

        // Auto-infer from Azure CLI if still not available (e.g., after azure/login)
        if (common.isNullOrWhiteSpace(subscriptionId) || common.isNullOrWhiteSpace(tenantId)) {
            try {
                let azOutput = await exec.getExecOutput(
                    'az account show --query "{tenantId:tenantId,id:id}" -o json',
                    [],
                    { silent: true, ignoreReturnCode: true }
                );
                if (azOutput.exitCode === 0) {
                    let account = JSON.parse(azOutput.stdout.trim());
                    if (common.isNullOrWhiteSpace(subscriptionId) && account.id) {
                        subscriptionId = account.id;
                        core.debug(`Auto-inferred subscriptionId from Azure CLI`);
                    }
                    if (common.isNullOrWhiteSpace(tenantId) && account.tenantId) {
                        tenantId = account.tenantId;
                        core.debug(`Auto-inferred tenantId from Azure CLI`);
                    }
                }
            } catch {
                core.debug('Azure CLI not available for auto-inference of subscriptionId/tenantId');
            }
        }

        if (!common.isNullOrWhiteSpace(subscriptionId)) {
            process.env.MSDO_SUBSCRIPTIONID = subscriptionId.trim();
            process.env.MSDO_AGENTLESS_SUBSCRIPTION_ID = subscriptionId.trim();
        }

        if (!common.isNullOrWhiteSpace(tenantId)) {
            process.env.MSDO_TENANTID = tenantId.trim();
            process.env.MSDO_AGENTLESS_TENANT_ID = tenantId.trim();
        }

        await client.run(args, 'microsoft/security-devops-action');
    }
}