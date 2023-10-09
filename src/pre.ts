import * as core from '@actions/core';

export async function run() {
    const startTime = new Date().toISOString();
    core.saveState('PreJobStartTime', startTime);
    console.log('PreJobStartTime', startTime);
}

run().catch((error) => {
    core.debug(error);
});