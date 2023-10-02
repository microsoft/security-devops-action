import { expect } from 'chai';
import sinon from 'sinon';
import * as core from '@actions/core';
import { prejobRun } from '../lib/pre';

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
        dateSub.returns('2023-01-23T45:12:34.567Z');

        // Call the run function
        await prejobRun();

        // Assert that core.saveState was called with the expected arguments
        expect(saveStateStub).to.have.been.calledWith('PreJobStartTime', '2023-01-23T45:12:34.567Z');
    });
});