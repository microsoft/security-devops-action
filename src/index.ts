import * as core from '@actions/core';
import { MicrosoftSecurityDevOps } from './msdo';
import { Inputs, RunnerType, CommandType } from './msdo-helpers';
import { IMicrosoftSecurityDevOps, IMicrosoftSecurityDevOpsFactory } from './msdo-interface';
import { ContainerMapping } from './container-mapping';
import * as common from '@microsoft/security-devops-actions-toolkit/msdo-common';

/**
 * Runs the action.
 * @param runnerString The runner where the task is being run: main, pre, or post. 
 */
export async function run(runnerString: string) {
    let runner = runnerString as RunnerType;
    let command: CommandType = getCommandType();

    switch (runner) {
        case RunnerType.Main:
            await _runMain(command);
            break;
        case RunnerType.Pre:
            await _runPreJob(command);
            break;
        case RunnerType.Post:
            await _runPostJob(command);
            break;
        default:
            throw new Error(`Invalid source type for the task: ${runnerString}`);
    }
}

async function _runPreJob(command: CommandType) {
    if (command != CommandType.All) {
        return;
    }
    // if explicit PreJob, will run in main
    if (_toolIsEnabled(Inputs.ContainerMapping)) {
        await _getExecutor(ContainerMapping).runPreJob();
    }
}

async function _runPostJob(command: CommandType) {
    if (command != CommandType.All) {
        return;
    }
    // if explicit PostJob, will run in main
    if (_toolIsEnabled(Inputs.ContainerMapping)) {
        await _getExecutor(ContainerMapping).runPostJob();
    }
}

async function _runMain(command: CommandType) {
    if (command == CommandType.PreJob) {
        // Explicit pre-job
        await _runPreJob(command);
    } else if (command == CommandType.PostJob) {
        // Explicit post-job
        await _runPostJob(command);
    } else if (command == CommandType.All || command == CommandType.Run) {
        // Run main
        await _getExecutor(MicrosoftSecurityDevOps).runMain();
    } else {
        throw new Error(`Invalid command type for the main task: ${command}`);
    }
}

/**
 * Returns true if the tool is enabled in the inputs.
 * @param toolName - The name of the tool. 
 * @returns True if the tool is enabled in the inputs.
 */
function _toolIsEnabled(toolName: string) {
    let enabled: boolean = false;
    let toolsString: string = core.getInput('tools');
    if (!common.isNullOrWhiteSpace(toolsString)) {
        let tools = toolsString.split(',');
        const toolIndex = tools.indexOf(toolName);
        enabled = toolIndex > -1;
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

function getCommandType(): CommandType {
    const commandTypeString: string = core.getInput(Inputs.Command) || CommandType.Run;
    return commandTypeString as CommandType;
}