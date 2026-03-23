import assert from 'assert';
import sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { resolveFileName, setVariables } from '../lib/v2/defender-installer';

describe('defender-installer', () => {

    describe('resolveFileName', () => {
        it('should return a platform-appropriate binary name', () => {
            const result = resolveFileName();
            const platform = process.platform;

            if (platform === 'win32') {
                assert.ok(result.startsWith('Defender_win-'), `Expected Windows binary, got: ${result}`);
                assert.ok(result.endsWith('.exe'), `Expected .exe extension, got: ${result}`);
            } else if (platform === 'linux') {
                assert.ok(result.startsWith('Defender_linux-'), `Expected Linux binary, got: ${result}`);
                assert.ok(!result.endsWith('.exe'), `Unexpected .exe extension on Linux`);
            } else if (platform === 'darwin') {
                assert.ok(result.startsWith('Defender_osx-'), `Expected macOS binary, got: ${result}`);
                assert.ok(!result.endsWith('.exe'), `Unexpected .exe extension on macOS`);
            }
        });

        it('should include architecture in the filename', () => {
            const result = resolveFileName();
            assert.ok(
                result.includes('x64') || result.includes('arm64') || result.includes('x86'),
                `Expected architecture in filename, got: ${result}`
            );
        });

        it('should return a non-empty string', () => {
            const result = resolveFileName();
            assert.ok(result.length > 0);
        });
    });

    describe('setVariables', () => {
        beforeEach(() => {
            delete process.env['DEFENDER_DIRECTORY'];
            delete process.env['DEFENDER_FILEPATH'];
            delete process.env['DEFENDER_INSTALLEDVERSION'];
        });

        afterEach(() => {
            delete process.env['DEFENDER_DIRECTORY'];
            delete process.env['DEFENDER_FILEPATH'];
            delete process.env['DEFENDER_INSTALLEDVERSION'];
        });

        it('should set environment variables correctly', () => {
            const packagesDir = path.join(os.tmpdir(), 'test-packages');
            setVariables(packagesDir, 'Defender_linux-x64', 'latest');

            assert.ok(process.env['DEFENDER_DIRECTORY']?.includes('test-packages'));
            assert.ok(process.env['DEFENDER_FILEPATH']?.includes('Defender_linux-x64'));
            assert.strictEqual(process.env['DEFENDER_INSTALLEDVERSION'], 'latest');
        });

        it('should throw when validate=true and file does not exist', () => {
            const packagesDir = path.join(os.tmpdir(), 'nonexistent-test-packages');
            assert.throws(
                () => setVariables(packagesDir, 'Defender_linux-x64', 'latest', true),
                /not found after download/
            );
        });

        it('should not throw when validate=false and file does not exist', () => {
            const packagesDir = path.join(os.tmpdir(), 'nonexistent-test-packages');
            assert.doesNotThrow(() => setVariables(packagesDir, 'Defender_linux-x64', 'latest', false));
        });
    });
});
