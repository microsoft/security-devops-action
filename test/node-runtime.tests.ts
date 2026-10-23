import assert from 'assert';
import sinon from 'sinon';
import * as core from '@actions/core';
import * as client from '@microsoft/security-devops-actions-toolkit/msdo-client';
import { MicrosoftSecurityDevOps } from '../lib/v1/msdo';

describe('MSDO action Node.js runtime', () => {
    let sandbox: sinon.SinonSandbox;
    let runStub: sinon.SinonStub;
    let infoStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(core, 'getInput').returns('');
        sandbox.stub(core, 'debug');
        infoStub = sandbox.stub(core, 'info');
        runStub = sandbox.stub(client, 'run').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    for (const version of [
        '22.23.4', '22.23.5', '22.24.0',
        '24.22.1', '24.22.2', '24.23.0',
        '26.12.1', '26.12.2', '26.13.0'
    ]) {
        it(`preserves CLI execution on patched Node.js ${version}`, async () => {
            sandbox.stub(process.versions, 'node').value(version);

            await new MicrosoftSecurityDevOps().runMain();

            sinon.assert.calledOnceWithExactly(
                runStub,
                ['run', '-p', 'GitHub', '--github'],
                'microsoft/security-devops-action'
            );
        });
    }

    for (const version of [
        '22.23.3', '22.22.99',
        '24.22.0', '24.21.99',
        '26.12.0', '26.11.99',
        '18.20.8', '20.20.0', '23.11.0', '25.9.0', '27.0.0',
        '24.22.1-rc.1', '24.22', '24.22.1.0', ''
    ]) {
        it(`rejects unpatched or unverified Node.js "${version}" before CLI installation`, async () => {
            sandbox.stub(process.versions, 'node').value(version);

            await assert.rejects(
                new MicrosoftSecurityDevOps().runMain(),
                /CVE-2026-111497/
            );
            sinon.assert.notCalled(runStub);
        });
    }

    it('logs the actual action interpreter and Brotli version', async () => {
        sandbox.stub(process.versions, 'node').value('24.22.1');

        await new MicrosoftSecurityDevOps().runMain();

        sinon.assert.calledWithExactly(
            infoStub,
            `Node.js action runtime: ${process.versions.node}; executable: ${process.execPath}; Brotli: ${process.versions.brotli}`
        );
    });

    it('reports the rejected runtime and explains runner remediation', async () => {
        sandbox.stub(process.versions, 'node').value('24.22.0');

        await assert.rejects(
            new MicrosoftSecurityDevOps().runMain(),
            /runner-managed.*actions\/setup-node/
        );
        sinon.assert.calledWithExactly(
            infoStub,
            `Node.js action runtime: ${process.versions.node}; executable: ${process.execPath}; Brotli: ${process.versions.brotli}`
        );
        sinon.assert.notCalled(runStub);
    });
});
