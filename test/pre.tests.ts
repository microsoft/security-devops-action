import sinon from 'sinon';
import * as core from '@actions/core';
import { ContainerMapping } from '../lib/container-mapping';

describe('prejob run', () => {
    let saveStateStub: sinon.SinonStub;

    beforeEach(() => {
        saveStateStub = sinon.stub(core, 'saveState');
        sinon.stub(core, 'info');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should save the current time as PreJobStartTime', async () => {
        const cm = new ContainerMapping();
        await cm.runPreJob();

        sinon.assert.calledWith(saveStateStub, 'PreJobStartTime', sinon.match.string);
    });

    it('should succeed even if runPreJob throws internally', async () => {
        saveStateStub.throws(new Error('saveState failed'));

        const cm = new ContainerMapping();
        // Should not throw because errors are caught inside runPreJob
        await cm.runPreJob();
    });
});
