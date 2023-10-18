import { CommandType } from "./msdo-helpers";

/*
* Interface for the MicrosoftSecurityDevOps task
*/
export interface IMicrosoftSecurityDevOps {
    readonly succeedOnError: boolean;
    /* param source - The source of the task: main, pre, or post. */
    run(source: string, command: string): any;
}

/**
 * Factory interface for creating instances of the `IMicrosoftSecurityDevOps` interface.
 * This factory enforces the inputs that can be used for creation of the `IMicrosoftSecurityDevOps` instances.
 */
export interface IMicrosoftSecurityDevOpsFactory {
    new (commandType: CommandType): IMicrosoftSecurityDevOps;
}