import * as core from '@actions/core';
import { runPreJob } from './index';

async function runPre() {
    await runPreJob();
}

runPre().catch((error) => {
    core.debug(error);
});