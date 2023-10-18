import * as core from '@actions/core';
import { run } from './index';
import { SourceType } from './msdo-helpers';

const source = SourceType.Pre;

export async function runPre() {
    await run(source);
}

runPre().catch((error) => {
    core.debug(error);
});