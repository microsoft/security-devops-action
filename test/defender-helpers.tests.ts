import assert from 'assert';
import sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
    validateScanType,
    validateFileSystemPath,
    validateImageName,
    validateModelPath,
    validateModelUrl,
    isUrl,
    parseAdditionalArgs,
    ScanType
} from '../lib/v2/defender-helpers';

describe('defender-helpers', () => {

    describe('validateScanType', () => {
        it('should accept "fs" as a valid scan type', () => {
            assert.strictEqual(validateScanType('fs'), ScanType.FileSystem);
        });

        it('should accept "image" as a valid scan type', () => {
            assert.strictEqual(validateScanType('image'), ScanType.Image);
        });

        it('should accept "model" as a valid scan type', () => {
            assert.strictEqual(validateScanType('model'), ScanType.Model);
        });

        it('should throw for invalid scan type', () => {
            assert.throws(() => validateScanType('invalid'), /Invalid scan type/);
        });

        it('should throw for empty string', () => {
            assert.throws(() => validateScanType(''), /Invalid scan type/);
        });
    });

    describe('validateFileSystemPath', () => {
        it('should return trimmed path when it exists', () => {
            // Use __dirname as a known-existing path
            const result = validateFileSystemPath(`  ${__dirname}  `);
            assert.strictEqual(result, __dirname);
        });

        it('should throw when path is empty', () => {
            assert.throws(() => validateFileSystemPath(''), /cannot be empty/);
        });

        it('should throw when path is whitespace', () => {
            assert.throws(() => validateFileSystemPath('   '), /cannot be empty/);
        });

        it('should throw when path does not exist', () => {
            assert.throws(() => validateFileSystemPath('/definitely/nonexistent/path/abc123'), /does not exist/);
        });
    });

    describe('validateImageName', () => {
        it('should accept simple image name', () => {
            assert.strictEqual(validateImageName('nginx'), 'nginx');
        });

        it('should accept image with tag', () => {
            assert.strictEqual(validateImageName('nginx:latest'), 'nginx:latest');
        });

        it('should accept fully qualified image name', () => {
            assert.strictEqual(
                validateImageName('myregistry.azurecr.io/myapp:v1.0'),
                'myregistry.azurecr.io/myapp:v1.0'
            );
        });

        it('should accept image with sha256 digest', () => {
            const digest = 'nginx@sha256:' + 'a'.repeat(64);
            assert.strictEqual(validateImageName(digest), digest);
        });

        it('should throw for empty image name', () => {
            assert.throws(() => validateImageName(''), /cannot be empty/);
        });

        it('should trim whitespace', () => {
            assert.strictEqual(validateImageName('  nginx:latest  '), 'nginx:latest');
        });
    });

    describe('isUrl', () => {
        it('should return true for http URL', () => {
            assert.strictEqual(isUrl('http://example.com'), true);
        });

        it('should return true for https URL', () => {
            assert.strictEqual(isUrl('https://example.com/model'), true);
        });

        it('should return false for local path', () => {
            assert.strictEqual(isUrl('/local/path'), false);
        });

        it('should return false for empty string', () => {
            assert.strictEqual(isUrl(''), false);
        });

        it('should return false for null/undefined', () => {
            assert.strictEqual(isUrl(null as any), false);
            assert.strictEqual(isUrl(undefined as any), false);
        });
    });

    describe('validateModelUrl', () => {
        it('should accept valid https URL', () => {
            assert.strictEqual(validateModelUrl('https://example.com/model'), 'https://example.com/model');
        });

        it('should accept valid http URL', () => {
            assert.strictEqual(validateModelUrl('http://example.com/model'), 'http://example.com/model');
        });

        it('should throw for invalid URL format', () => {
            assert.throws(() => validateModelUrl('not-a-url'), /Invalid URL/);
        });
    });

    describe('validateModelPath', () => {
        it('should throw for empty path', () => {
            assert.throws(() => validateModelPath(''), /cannot be empty/);
        });

        it('should accept URL without checking filesystem', () => {
            const result = validateModelPath('https://example.com/model');
            assert.strictEqual(result, 'https://example.com/model');
        });

        it('should accept existing directory as model path', () => {
            // Use __dirname as a known-existing directory
            const result = validateModelPath(__dirname);
            assert.strictEqual(result, __dirname);
        });

        it('should throw when local path does not exist', () => {
            assert.throws(() => validateModelPath('/definitely/nonexistent/model/path'), /does not exist/);
        });
    });

    describe('parseAdditionalArgs', () => {
        it('should return empty array for undefined', () => {
            assert.deepStrictEqual(parseAdditionalArgs(undefined), []);
        });

        it('should return empty array for empty string', () => {
            assert.deepStrictEqual(parseAdditionalArgs(''), []);
        });

        it('should return empty array for whitespace', () => {
            assert.deepStrictEqual(parseAdditionalArgs('   '), []);
        });

        it('should parse simple arguments', () => {
            assert.deepStrictEqual(parseAdditionalArgs('--flag1 --flag2'), ['--flag1', '--flag2']);
        });

        it('should handle quoted arguments', () => {
            assert.deepStrictEqual(
                parseAdditionalArgs('--flag "value with spaces"'),
                ['--flag', 'value with spaces']
            );
        });

        it('should handle single-quoted arguments', () => {
            assert.deepStrictEqual(
                parseAdditionalArgs("--flag 'value with spaces'"),
                ['--flag', 'value with spaces']
            );
        });
    });
});
