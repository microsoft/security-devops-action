import * as core from '@actions/core';
import { ContainerMapping } from './container-mapping';
import { getExecutor } from './msdo-interface';

async function runPre() {
    await getExecutor(ContainerMapping).runPreJob();
}

runPre().catch((error) => {
    core.debug(error);
});