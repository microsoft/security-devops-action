import * as core from '@actions/core';
import { ContainerMapping } from './container-mapping';
import { getExecutor } from './msdo-interface';

export async function run() {
    await getExecutor(ContainerMapping).runPreJob();
}

run().catch((error) => {
    core.warning(`Pre-job failed: ${error}`);
});
