import * as core from '@actions/core';
import { ContainerMapping } from './container-mapping';
import { getDefenderExecutor } from './defender-interface';

async function runPost() {
    await getDefenderExecutor(ContainerMapping).runPostJob();
}

runPost().catch((error) => {
    core.debug(error);
});
