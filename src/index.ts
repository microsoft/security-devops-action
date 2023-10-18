import * as core from '@actions/core';
import { MicrosoftSecurityDevOps } from './msdo';
import { Inputs, CommandType, writeToOutStream } from './msdo-helpers';
import { IMicrosoftSecurityDevOps, IMicrosoftSecurityDevOpsFactory } from './msdo-interface';
import { ContainerMapping } from './container-mapping';

let succeedOnError = false;

/**
 * Returns an instance of IMicrosoftSecurityDevOps based on the input command type.
 * @param inputString - The input command type.
 * @returns An instance of IMicrosoftSecurityDevOps.
 * @throws An error if the input command type is invalid.
 */
function _getMsdoRunner(inputString: string): IMicrosoftSecurityDevOps {
    var commandType = inputString as CommandType;
    switch (commandType) {
        case CommandType.PreJob:
        case CommandType.PostJob:
            return _getExecutor(ContainerMapping, commandType);
        case CommandType.Run:
            return _getExecutor(MicrosoftSecurityDevOps, commandType);
        default:
            throw new Error(`Invalid command type for the task: ${this.commandType}`);
    }
}

/**
 * Returns an instance of IMicrosoftSecurityDevOps based on the input runner and command type.
 * (This is used to enforce strong typing for the inputs for the runner).
 * @param runner - The runner to use to create the instance of IMicrosoftSecurityDevOps.
 * @param commandType - The input command type.
 * @returns An instance of IMicrosoftSecurityDevOps.
 */
function _getExecutor(runner: IMicrosoftSecurityDevOpsFactory, commandType: CommandType): IMicrosoftSecurityDevOps {
    return new runner(commandType);
}

async function run() {
    const commandType: string = core.getInput(Inputs.CommandType) || CommandType.Run;
    core.debug('Running Command: ' + commandType);
    const msdoRunner = _getMsdoRunner(commandType);
    succeedOnError = msdoRunner.succeedOnError;
    await msdoRunner.run();
}

run().catch((error) => core.setFailed(error));

run().catch(error => {
    if (succeedOnError) {
        writeToOutStream('Ran into error: ' + error);
    } else {
        core.setFailed(error);
    }
    console.log('------------------------------------------------------------------------------');
    console.log('Effective September 20th 2023, the Secret Scanning option (CredScan) within Microsoft Security DevOps (MSDO) Extension for Azure DevOps is deprecated. MSDO Secret Scanning is replaced by the Configure GitHub Advanced Security for Azure DevOps features - https://learn.microsoft.com/en-us/azure/devops/repos/security/configure-github-advanced-security-features#set-up-secret-scanning.');
    console.log('------------------------------------------------------------------------------');
});