import * as core from '@actions/core';
import { MicrosoftDefenderCLI } from './defender-cli';
import { IMicrosoftDefenderCLI, IMicrosoftDefenderCLIFactory, getDefenderExecutor } from './defender-interface';
import { writeToOutStream } from './defender-helpers';

let succeedOnError = false;

/**
 * Returns an instance of IMicrosoftDefenderCLI.
 * The scan type (fs, image, model) is determined by the CLI class based on action inputs.
 */
function _getDefenderRunner(): IMicrosoftDefenderCLI {
    return getDefenderExecutor(MicrosoftDefenderCLI);
}

/**
 * Main entry point for the Defender CLI v2 action.
 * Creates and runs the Defender CLI which handles all scan types (filesystem, image, model).
 */
async function run() {
    core.debug('Starting Microsoft Defender for DevOps scan');
    const defenderRunner = _getDefenderRunner();
    succeedOnError = defenderRunner.succeedOnError;
    await defenderRunner.runMain();
}

run().catch(error => {
    if (succeedOnError) {
        writeToOutStream('Ran into error: ' + error);
        core.info('Finished execution with error (succeedOnError=true)');
    } else {
        core.setFailed(error);
    }
});
