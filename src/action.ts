import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as gdn from './gdn-toolkit';

new gdn.GuardianAction(core, exec).analyze();