import * as core from '@actions/core';

async function run() {
    const startTime = new Date().toISOString();
    core.saveState('PreJobStartTime', startTime);
}

run().catch((error) => {
    core.debug(error);
});