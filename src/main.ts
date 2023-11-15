import * as core from '@actions/core';
import { run } from './index';
import { RunnerType } from './msdo-helpers';

const runner = RunnerType.Main;

async function runMain() {
    await run(runner);
}

runMain().catch(error => {
    core.setFailed(error);
});