import * as core from '@actions/core';
import { run } from './index';
import { SourceType } from './msdo-helpers';

const source = SourceType.Post;

async function runPost() {
    await run(source);
}

runPost().catch((error) => {
    core.debug(error);
});