/*
* Interface for the MicrosoftSecurityDevOps task
*/
export interface IMicrosoftSecurityDevOps {
    readonly succeedOnError: boolean;
    /* param source - The source of the task: main, pre, or post. */
    runPreJob(): any;
    runMain(): any;
    runPostJob(): any;
}

/**
 * Factory interface for creating instances of the `IMicrosoftSecurityDevOps` interface.
 * This factory enforces the inputs that can be used for creation of the `IMicrosoftSecurityDevOps` instances.
 */
export interface IMicrosoftSecurityDevOpsFactory {
    new (): IMicrosoftSecurityDevOps;
}

/**
 * Returns an instance of IMicrosoftSecurityDevOps based on the input runner and command type.
 * (This is used to enforce strong typing for the inputs for the runner).
 * @param runner - The runner to use to create the instance of IMicrosoftSecurityDevOps.
 * @param commandType - The input command type.
 * @returns An instance of IMicrosoftSecurityDevOps.
 */
export function getExecutor(runner: IMicrosoftSecurityDevOpsFactory): IMicrosoftSecurityDevOps {
    return new runner();
}