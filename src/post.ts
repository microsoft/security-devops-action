import * as core from '@actions/core';
import { runPostJob } from './index';

async function runPost() {
    await runPostJob();
}

runPost().catch((error) => {
    core.debug(error);
});