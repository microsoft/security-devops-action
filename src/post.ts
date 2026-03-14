import * as core from '@actions/core';
import { ContainerMapping } from './container-mapping';
import { getExecutor } from './msdo-interface';

export async function run() {
    await getExecutor(ContainerMapping).runPostJob();
}

run().catch((error) => {
    core.warning(`Post-job failed: ${error}`);
});
