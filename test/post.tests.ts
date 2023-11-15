import assert from 'assert';
import https from 'https';
import sinon from 'sinon';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { run, sendReport, _sendReport } from '../lib/post';

describe('postjob run', function() {
    let execStub: sinon.SinonStub;
    let sendReportStub: sinon.SinonStub;

    beforeEach(() => {
        execStub = sinon.stub(exec, 'exec');
        sendReportStub = sinon.stub(sendReport);
    });

    afterEach(() => {
        execStub.restore();
        sendReport.restore();
    });

    it('should run three docker commands and send the report', async () => {
        await run();

        sinon.assert.callCount(execStub, 3);
        sinon.assert.calledWith(execStub, 'docker --version');
        sinon.assert.calledWith(execStub, 'docker images --format CreatedAt={{.CreatedAt}}::Repo={{.Repository}}::Tag={{.Tag}}::Digest={{.Digest}}');

        sinon.assert.calledOnce(sendReport);
    });
});

describe('postjob sendReport', function() {
    let _sendReportStub: sinon.SinonStub;
    let data: Object;

    beforeEach(() => {
        _sendReportStub = sinon.stub(_sendReport);
        data = {
            "key.fake": "value.fake"
        };
    });
    
    afterEach(() => {
        _sendReportStub.restore();
    });

    it('should still call _sendReport once if retryCount < 1', async () => {
        await sendReport(data, -1);
        sinon.assert.calledOnce(_sendReport);
    });

    it('should succeed if _sendReport succeeds', async () => {
        _sendReportStub.throws(new Error('_sendReport().Error'));

        await sendReport(data, 0);
        sinon.assert.calledOnce(_sendReport);
    });

    it('should succeed if _sendReport succeeds', async () => {


        await sendReport(data, 0);
        sinon.assert.calledOnce(_sendReport);
    });

    // should still call _sendReport once if retryCount < 1
    // should succeed if _sendReport succeeds
    // should fail if _sendReport fails and retryCount == 0
    // should succeed if _sendReport fails the first time and succeeds the second if retryCount > 0
    // should fail if _sendReport fails for all retries

});


describe('postjob _sendReport', function() {
    let core_getIDTokenStub: sinon.SinonStub;
    let https_requestStub: sinon.SinonStub;
    let clientRequestStub;
    let data: Object;
    const expectedUrl = 'https://dfdinfra-afdendpoint2-dogfood-edb5h5g7gyg7h3hq.z01.azurefd.net/github/v1/container-mappings';

    beforeEach(() => {
        core_getIDTokenStub = sinon.stub(core, 'getIDToken');
        https_requestStub = sinon.stub(https, 'request');
        clientRequestStub = sinon.stub();
        clientRequestStub.end = sinon.stub();

        core_getIDTokenStub.resolves('bearerToken.mock');
        https_requestStub
            .callsArgWith(2, {
                on: (event, callback) => {
                    if (event === 'data') {
                        callback();
                    } else if (event === 'end') {
                        callback();
                    }
                },
                end: () => {}
            })
            .returns(clientRequestStub);

        data = {
            "key.fake": "value.fake"
        };
    });
    
    afterEach(() => {
        core_getIDTokenStub.restore();
        https_requestStub.restore();
        clientRequestStub.restore();
    });

    it('should still call _sendReport once if retryCount < 1', async () => {
        await _sendReport(data, -1);
        sinon.assert.calledOnce(core_getIDTokenStub);
        sinon.assert.calledOnce(https_requestStub);

        // {
        //     method: 'POST',
        //     timeout: 2500,
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': 'Bearer bearerToken.mock'
        //     },
        //     data: data
        // };
    });
});