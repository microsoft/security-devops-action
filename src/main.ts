import * as core from '@actions/core';
import { runMainJob } from './index';

async function runMain() {
    await runMainJob();
}

runMain().catch(error => {
    core.setFailed(error);
});