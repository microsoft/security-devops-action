import * as core from '@actions/core';
import { MicrosoftSecurityDevOps } from './msdo';
import { getExecutor } from './msdo-interface';

async function runMain() {
    await getExecutor(MicrosoftSecurityDevOps).runMain();
}

runMain().catch(error => {
    core.setFailed(error);
});