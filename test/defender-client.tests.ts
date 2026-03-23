import assert from 'assert';
import sinon from 'sinon';
import * as exec from '@actions/exec';
import * as core from '@actions/core';
import * as installer from '../lib/v2/defender-installer';

describe('defender-client', () => {
    let execStub: sinon.SinonStub;
    let installStub: sinon.SinonStub;

    beforeEach(() => {
        execStub = sinon.stub(exec, 'exec');
        installStub = sinon.stub(installer, 'install');

        // Set up environment for tests
        process.env['DEFENDER_FILEPATH'] = '/path/to/defender';
        process.env['RUNNER_TOOL_CACHE'] = '/tmp/tool-cache';

        installStub.resolves();
        execStub.resolves(0);
    });

    afterEach(() => {
        execStub.restore();
        installStub.restore();
        delete process.env['DEFENDER_FILEPATH'];
        delete process.env['RUNNER_TOOL_CACHE'];
        delete process.env['DEFENDER_PACKAGES_DIRECTORY'];
        delete process.env['RUNNER_DEBUG'];
    });

    it('should call exec with correct args for filesystem scan', async () => {
        const { scanDirectory } = require('../lib/v2/defender-client');
        await scanDirectory('/test/path', 'github', '/output/defender.sarif', [0], []);

        sinon.assert.calledOnce(execStub);
        const args = execStub.firstCall.args;
        assert.strictEqual(args[0], '/path/to/defender');
        assert.ok(args[1].includes('scan'));
        assert.ok(args[1].includes('fs'));
        assert.ok(args[1].includes('/test/path'));
        assert.ok(args[1].includes('--defender-policy'));
        assert.ok(args[1].includes('github'));
        assert.ok(args[1].includes('--defender-output'));
    });

    it('should call exec with correct args for image scan', async () => {
        const { scanImage } = require('../lib/v2/defender-client');
        await scanImage('nginx:latest', 'mdc', '/output/defender.sarif', [0], ['--defender-break']);

        sinon.assert.calledOnce(execStub);
        const args = execStub.firstCall.args;
        assert.strictEqual(args[0], '/path/to/defender');
        assert.ok(args[1].includes('scan'));
        assert.ok(args[1].includes('image'));
        assert.ok(args[1].includes('nginx:latest'));
        assert.ok(args[1].includes('--defender-break'));
    });

    it('should throw when CLI exits with non-zero code', async () => {
        execStub.resolves(1);
        const { scanDirectory } = require('../lib/v2/defender-client');

        await assert.rejects(
            () => scanDirectory('/test/path'),
            /error exit code: 1/
        );
    });

    it('should add --defender-debug when RUNNER_DEBUG is set', async () => {
        process.env['RUNNER_DEBUG'] = '1';
        const { scanDirectory } = require('../lib/v2/defender-client');
        await scanDirectory('/test/path', 'github', '/output/defender.sarif', [0], []);

        sinon.assert.calledOnce(execStub);
        const args = execStub.firstCall.args[1];
        assert.ok(args.includes('--defender-debug'));
    });
});
