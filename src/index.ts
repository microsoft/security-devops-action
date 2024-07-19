import * as core from '@actions/core';
import { MicrosoftSecurityDevOps } from './msdo';
import { Inputs, Tools } from './msdo-helpers';
import { IMicrosoftSecurityDevOps, IMicrosoftSecurityDevOpsFactory } from './msdo-interface';
import { ContainerMapping } from './container-mapping';
import * as common from '@microsoft/security-devops-actions-toolkit/msdo-common';

export async function runPreJob() {
    if (_toolIsEnabled(Tools.ContainerMapping)) {
        await _getExecutor(ContainerMapping).runPreJob();
    }
}

export async function runPostJob() {
    if (_toolIsEnabled(Tools.ContainerMapping)) {
        await _getExecutor(ContainerMapping).runPostJob();
    }
}

export async function runMainJob() {
    // If container-mapping is the only enabled tool, then skip scanning
    if (_toolIsEnabledOnInput(Inputs.Tools, Tools.ContainerMapping, true)) {
        console.log("Scanning is not enabled. Skipping...");
    } else {
        await _getExecutor(MicrosoftSecurityDevOps).runMain();
    }
}

/**
 * Returns true if the tool is enabled on either the tools or includeTools inputs.
 * @param toolName - The name of the tool. 
 * @returns True if the tool is enabled in the inputs.
 */
function _toolIsEnabled(toolName: string): boolean {
    let enabled: boolean = false;

    enabled = _toolIsEnabledOnInput(Inputs.Tools, toolName, false);
    
    if (!enabled) {
        // See if the tool is in includeTools
        enabled = _toolIsEnabledOnInput(Inputs.IncludeTools, toolName, false);
    }

    return enabled;
}

/**
 * Returns true if the tool is enabled on the specified input.
 * @param inputName The action input name to check for the list of tools. Values tools or includeTools.
 * @param toolName The name of the tool to look for.
 * @param isOnlyTool Return true only if it is the only tool.
 * @returns True if the tool is enabled on the specified input.
 */
function _toolIsEnabledOnInput(inputName: string, toolName: string, isOnlyTool: boolean = false) {
    let enabled: boolean = false;
    let toolsString: string = core.getInput(inputName);
    if (!common.isNullOrWhiteSpace(toolsString)) {
        let tools = toolsString.split(',');
        if (isOnlyTool && tools.length > 1) {
            enabled = false;
        } else {
            const toolIndex = tools.indexOf(toolName);
            enabled = toolIndex > -1;
        }
    }
    return enabled;
}

/**
 * Returns an instance of IMicrosoftSecurityDevOps based on the input runner and command type.
 * (This is used to enforce strong typing for the inputs for the runner).
 * @param runner - The runner to use to create the instance of IMicrosoftSecurityDevOps.
 * @param commandType - The input command type.
 * @returns An instance of IMicrosoftSecurityDevOps.
 */
function _getExecutor(runner: IMicrosoftSecurityDevOpsFactory): IMicrosoftSecurityDevOps {
    return new runner();
}