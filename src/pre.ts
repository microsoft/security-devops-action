import * as core from '@actions/core';
import { run } from './index';
import { RunnerType } from './msdo-helpers';

const runner = RunnerType.Pre;

async function runPre() {
    await run(runner);
}

runPre().catch((error) => {
    core.debug(error);
});