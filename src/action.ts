import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as gdn from './gdn-toolkit/gdn-tookit';

new gdn.GuardianAction(core, exec).analyze();