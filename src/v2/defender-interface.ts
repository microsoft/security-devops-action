/*
 * Interface for the MicrosoftDefenderCLI task.
 * Mirrors the AzDevOps v2 defender-interface.ts, adapted for GitHub Actions 3-phase lifecycle.
 */
export interface IMicrosoftDefenderCLI {
    readonly succeedOnError: boolean;
    runPreJob(): any;
    runMain(): any;
    runPostJob(): any;
}

/*
 * Factory interface for creating IMicrosoftDefenderCLI instances.
 */
export interface IMicrosoftDefenderCLIFactory {
    new(): IMicrosoftDefenderCLI;
}

/**
 * Returns an instance of IMicrosoftDefenderCLI based on the input runner.
 * @param runner - The factory to use to create the instance.
 * @returns An instance of IMicrosoftDefenderCLI.
 */
export function getDefenderExecutor(runner: IMicrosoftDefenderCLIFactory): IMicrosoftDefenderCLI {
    return new runner();
}
