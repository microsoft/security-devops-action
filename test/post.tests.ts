import sinon from 'sinon';
import * as core from '@actions/core';
import { ContainerMapping } from '../lib/container-mapping';

describe('postjob run', function() {
    beforeEach(() => {
        sinon.stub(core, 'info');
        sinon.stub(core, 'debug');
        sinon.stub(core, 'warning');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should not throw even when post-job encounters errors', async () => {
        sinon.stub(core, 'getState').returns('');
        sinon.stub(core, 'getIDToken').rejects(new Error('No OIDC token'));

        const cm = new ContainerMapping();
        // Should not throw because errors are caught inside runPostJob
        await cm.runPostJob();
    });

    it('should skip container mapping when client is not onboarded', async () => {
        sinon.stub(core, 'getState').returns('2023-01-01T00:00:00.000Z');
        sinon.stub(core, 'getIDToken').resolves('mock-token');

        // Mock _checkCallerIsCustomer to return 403 (not onboarded)
        const cm = new ContainerMapping();
        sinon.stub(cm as any, '_checkCallerIsCustomer').resolves(403);

        await cm.runPostJob();

        sinon.assert.calledWith(core.warning as sinon.SinonStub, sinon.match('not onboarded'));
    });
});

describe('postjob sendReport', function() {
    let cm: ContainerMapping;

    beforeEach(() => {
        sinon.stub(core, 'info');
        sinon.stub(core, 'debug');
        cm = new ContainerMapping();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return false when _sendReport fails and retryCount is 0', async () => {
        sinon.stub(cm, '_sendReport').rejects(new Error('API error'));

        const result = await cm.sendReport('{}', 'mock-token', 0);
        sinon.assert.match(result, false);
    });

    it('should retry when _sendReport fails and retryCount > 0', async () => {
        const sendReportStub = sinon.stub(cm, '_sendReport');
        sendReportStub.onFirstCall().rejects(new Error('API error'));
        sendReportStub.onSecondCall().resolves();

        const result = await cm.sendReport('{}', 'mock-token', 1);
        sinon.assert.match(result, true);
        sinon.assert.calledTwice(sendReportStub);
    });

    it('should return true when _sendReport succeeds', async () => {
        sinon.stub(cm, '_sendReport').resolves();

        const result = await cm.sendReport('{}', 'mock-token', 0);
        sinon.assert.match(result, true);
    });
});
