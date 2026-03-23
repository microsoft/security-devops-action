import * as core from '@actions/core';
import { ContainerMapping } from './container-mapping';
import { getDefenderExecutor } from './defender-interface';

async function runPre() {
    await getDefenderExecutor(ContainerMapping).runPreJob();
}

runPre().catch((error) => {
    core.debug(error);
});
