import sinon from 'sinon';
import * as core from '@actions/core';
import { run } from '../lib/pre';

describe('prejob run', () => {
    let saveStateStub: sinon.SinonStub;
    let dateSub: sinon.SinonStub;

    beforeEach(() => {
        saveStateStub = sinon.stub(core, 'saveState');
        dateSub = sinon.stub(global, 'Date');
    });

    afterEach(() => {
        saveStateStub.restore();
    });

    it('should save the current time as PreJobStartTime', async () => {
        dateSub.returns({
            toISOString: () => '2023-01-23T45:12:34.567Z'
        });

        await run();

        sinon.assert.calledWithExactly(saveStateStub, 'PreJobStartTime', '2023-01-23T45:12:34.567Z');
    });
});