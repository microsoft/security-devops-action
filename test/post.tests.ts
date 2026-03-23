import sinon from 'sinon';
import * as core from '@actions/core';
import { ContainerMapping } from '../lib/v1/container-mapping';

describe('postjob runPostJob', function() {
    let getIDTokenStub: sinon.SinonStub;
    let getStateStub: sinon.SinonStub;
    let debugStub: sinon.SinonStub;
    let infoStub: sinon.SinonStub;

    beforeEach(() => {
        infoStub = sinon.stub(core, 'info');
        debugStub = sinon.stub(core, 'debug');
        getStateStub = sinon.stub(core, 'getState').returns('2023-01-23T12:34:56.789Z');
        getIDTokenStub = sinon.stub(core, 'getIDToken');
    });

    afterEach(() => {
        infoStub.restore();
        debugStub.restore();
        getStateStub.restore();
        getIDTokenStub.restore();
    });

    it('should handle missing OIDC token gracefully', async () => {
        getIDTokenStub.rejects(new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable'));

        const cm = new ContainerMapping();
        // runPostJob catches all errors internally
        await cm.runPostJob();

        sinon.assert.calledOnce(getIDTokenStub);
    });

    it('should skip container mapping if caller is not onboarded', async () => {
        getIDTokenStub.resolves('mock-token');

        // Stub the https request for checkCallerIsCustomer to return 403 (not onboarded)
        const https = require('https');
        const requestStub = sinon.stub(https, 'request');
        requestStub.callsFake((_url: string, _options: any, callback: any) => {
            const res = {
                statusCode: 403,
                on: (event: string, handler: any) => {
                    if (event === 'end') handler();
                    if (event === 'data') { /* no data */ }
                }
            };
            callback(res);
            return { on: sinon.stub(), end: sinon.stub(), write: sinon.stub() };
        });

        const cm = new ContainerMapping();
        await cm.runPostJob();

        sinon.assert.calledOnce(getIDTokenStub);
        requestStub.restore();
    });

    it('should use fallback start time when PreJobStartTime is not set', async () => {
        getStateStub.returns('');
        getIDTokenStub.rejects(new Error('no token'));

        const cm = new ContainerMapping();
        await cm.runPostJob();

        sinon.assert.calledWith(debugStub, sinon.match('PreJobStartTime not defined'));
    });
});

describe('postjob ContainerMapping properties', function() {
    it('should have succeedOnError set to true', () => {
        const cm = new ContainerMapping();
        sinon.assert.match(cm.succeedOnError, true);
    });
});
