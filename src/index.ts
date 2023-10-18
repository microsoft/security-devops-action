import * as core from '@actions/core';
import { MicrosoftSecurityDevOps } from './msdo';
import { Inputs, SourceType, CommandType } from './msdo-helpers';
import { IMicrosoftSecurityDevOps, IMicrosoftSecurityDevOpsFactory } from './msdo-interface';
import { ContainerMapping } from './container-mapping';

const source = "main";

export async function run(sourceString: string) {
    var source = sourceString as SourceType;
    var command = getCommandType();

    switch (source) {
        case SourceType.Main:
            await _runMain(command);
            break;
        case SourceType.Pre:
            await _runPreJob(command);
            break;
        case SourceType.Post:
            await _runPostJob(command);
            break;
        default:
            throw new Error(`Invalid source type for the task: ${sourceString}`);
    }
}

async function _runPreJob(command: CommandType) {
    if (command != CommandType.All) {
        return;
    }
    // if explicit PreJob, will run in main
    await _getExecutor(ContainerMapping).runPreJob();
}

async function _runPostJob(command: CommandType) {
    if (command != CommandType.All) {
        return;
    }
    // if explicit PostJob, will run in main
    await _getExecutor(ContainerMapping).runPostJob();
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
    const commandTypeString: string = core.getInput(Inputs.CommandType.toString()) || CommandType.Run;
    return commandTypeString as CommandType;
}