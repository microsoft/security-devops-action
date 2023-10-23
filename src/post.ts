import * as core from '@actions/core';
import { run } from './index';
import { RunnerType } from './msdo-helpers';

const runner = RunnerType.Post;

async function runPost() {
    await run(runner);
}

runPost().catch((error) => {
    core.debug(error);
});