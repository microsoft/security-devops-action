import * as core from '@actions/core';
import { MicrosoftSecurityDevOps } from './msdo';
import { getExecutor } from './msdo-interface';
import * as common from '@microsoft/security-devops-actions-toolkit/msdo-common';
import { Tools } from './msdo-helpers';

async function runMain() {
    if (shouldRunMain())
    {
        await getExecutor(MicrosoftSecurityDevOps).runMain();
    }
    else {
        console.log("Scanning is not enabled. Skipping...");
    }
}

runMain().catch(error => {
    core.setFailed(error);
});

/**
 * Returns false if the 'tools' input is specified and the only tool on the list is 'container-mapping'.
 * This is because the MicrosoftSecurityDevOps executer does not have a workload for the container-mapping tool.
*/
function shouldRunMain() {
   let toolsString: string = core.getInput('tools');
   if (!common.isNullOrWhiteSpace(toolsString)) {
        let tools = toolsString.split(',');
        if (tools.length == 1 && tools[0].trim() == Tools.ContainerMapping) {
            return false;
        }
        return true;
   }
}