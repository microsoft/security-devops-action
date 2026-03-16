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

    it('should save the current time as PreJobStartTime', () => {
        const fakeDate = new Date('2023-01-23T12:34:56.789Z');
        const dateStub = sinon.useFakeTimers(fakeDate.getTime());

        const cm = new ContainerMapping();
        cm.runPreJob();

        sinon.assert.calledWithExactly(saveStateStub, 'PreJobStartTime', '2023-01-23T12:34:56.789Z');

        dateStub.restore();
    });

    it('should not throw on error', () => {
        saveStateStub.throws(new Error('test error'));

        const cm = new ContainerMapping();
        // runPreJob catches errors internally, should not throw
        cm.runPreJob();
    });
});
