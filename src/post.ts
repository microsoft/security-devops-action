import * as core from '@actions/core';
import { ContainerMapping } from './container-mapping';
import { getExecutor } from './msdo-interface';

async function runPost() {
    await getExecutor(ContainerMapping).runPostJob();
}

runPost().catch((error) => {
    core.debug(error);
});