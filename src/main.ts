import * as core from '@actions/core';
import { run } from './index';
import { SourceType, writeToOutStream } from './msdo-helpers';

const source = SourceType.Main;

async function runMain() {
    await run(source);
}

runMain().catch(error => {
    core.setFailed(error);
});