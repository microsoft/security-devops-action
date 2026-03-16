import assert from 'assert';
import sinon from 'sinon';
import * as core from '@actions/core';
import {
    mapLevelToSeverity,
    extractCveId,
    formatLocation,
    parseSarifContent,
    generateMarkdownSummary,
    generateNoFindingsSummary,
    Severity,
    SarifLevel
} from '../lib/v2/job-summary';

describe('job-summary', () => {

    describe('mapLevelToSeverity', () => {
        it('should use properties.severity when available', () => {
            assert.strictEqual(mapLevelToSeverity('error', { severity: 'critical' }), Severity.Critical);
        });

        it('should use properties.severity over level', () => {
            assert.strictEqual(mapLevelToSeverity('note', { severity: 'high' }), Severity.High);
        });

        it('should map error level to High', () => {
            assert.strictEqual(mapLevelToSeverity('error'), Severity.High);
        });

        it('should map warning level to Medium', () => {
            assert.strictEqual(mapLevelToSeverity('warning'), Severity.Medium);
        });

        it('should map note level to Low', () => {
            assert.strictEqual(mapLevelToSeverity('note'), Severity.Low);
        });

        it('should map none level to Low', () => {
            assert.strictEqual(mapLevelToSeverity('none'), Severity.Low);
        });

        it('should return Unknown for undefined level', () => {
            assert.strictEqual(mapLevelToSeverity(undefined), Severity.Unknown);
        });

        it('should return Unknown for unrecognized level', () => {
            assert.strictEqual(mapLevelToSeverity('unknown-level'), Severity.Unknown);
        });
    });

    describe('extractCveId', () => {
        it('should extract CVE from properties', () => {
            assert.strictEqual(extractCveId('rule1', { cveId: 'CVE-2024-1234' }), 'CVE-2024-1234');
        });

        it('should extract CVE from ruleId', () => {
            assert.strictEqual(extractCveId('CVE-2024-1234'), 'CVE-2024-1234');
        });

        it('should extract CVE from mixed case ruleId', () => {
            assert.strictEqual(extractCveId('cve-2024-5678'), 'CVE-2024-5678');
        });

        it('should return undefined when no CVE found', () => {
            assert.strictEqual(extractCveId('rule1'), undefined);
        });

        it('should return undefined for undefined inputs', () => {
            assert.strictEqual(extractCveId(undefined), undefined);
        });
    });

    describe('formatLocation', () => {
        it('should format location with uri and line', () => {
            const locations = [{
                physicalLocation: {
                    artifactLocation: { uri: 'src/main.ts' },
                    region: { startLine: 42 }
                }
            }];
            assert.strictEqual(formatLocation(locations), 'src/main.ts:42');
        });

        it('should format location with uri only', () => {
            const locations = [{
                physicalLocation: {
                    artifactLocation: { uri: 'src/main.ts' }
                }
            }];
            assert.strictEqual(formatLocation(locations), 'src/main.ts');
        });

        it('should return undefined for empty locations', () => {
            assert.strictEqual(formatLocation([]), undefined);
        });

        it('should return undefined for undefined locations', () => {
            assert.strictEqual(formatLocation(undefined), undefined);
        });
    });

    describe('parseSarifContent', () => {
        it('should parse valid SARIF with vulnerabilities', () => {
            const sarif = {
                version: '2.1.0',
                runs: [{
                    tool: {
                        driver: {
                            name: 'Defender',
                            rules: [{
                                id: 'CVE-2024-1234',
                                shortDescription: { text: 'Test vulnerability' },
                                defaultConfiguration: { level: 'error' }
                            }]
                        }
                    },
                    results: [{
                        ruleId: 'CVE-2024-1234',
                        message: { text: 'Found vulnerability' },
                        level: 'error',
                        properties: { severity: 'critical' }
                    }]
                }]
            };

            const summary = parseSarifContent(JSON.stringify(sarif));
            assert.strictEqual(summary.total, 1);
            assert.strictEqual(summary.critical, 1);
            assert.strictEqual(summary.vulnerabilities[0].ruleId, 'CVE-2024-1234');
        });

        it('should return empty summary for empty SARIF', () => {
            const sarif = { version: '2.1.0', runs: [{ results: [] }] };
            const summary = parseSarifContent(JSON.stringify(sarif));
            assert.strictEqual(summary.total, 0);
        });

        it('should handle invalid JSON gracefully', () => {
            const summary = parseSarifContent('not valid json');
            assert.strictEqual(summary.total, 0);
        });

        it('should handle SARIF with no runs', () => {
            const summary = parseSarifContent(JSON.stringify({ version: '2.1.0' }));
            assert.strictEqual(summary.total, 0);
        });

        it('should count multiple severity levels correctly', () => {
            const sarif = {
                version: '2.1.0',
                runs: [{
                    tool: { driver: { name: 'Defender' } },
                    results: [
                        { ruleId: 'r1', level: 'error', message: { text: 'high' }, properties: { severity: 'high' } },
                        { ruleId: 'r2', level: 'warning', message: { text: 'medium' } },
                        { ruleId: 'r3', level: 'note', message: { text: 'low' } },
                        { ruleId: 'r4', level: 'error', message: { text: 'critical' }, properties: { severity: 'critical' } }
                    ]
                }]
            };

            const summary = parseSarifContent(JSON.stringify(sarif));
            assert.strictEqual(summary.total, 4);
            assert.strictEqual(summary.critical, 1);
            assert.strictEqual(summary.high, 1);
            assert.strictEqual(summary.medium, 1);
            assert.strictEqual(summary.low, 1);
        });
    });

    describe('generateMarkdownSummary', () => {
        it('should generate summary with critical findings', () => {
            const summary = {
                total: 2,
                critical: 1,
                high: 1,
                medium: 0,
                low: 0,
                unknown: 0,
                vulnerabilities: [
                    { ruleId: 'CVE-2024-1', message: 'Critical issue', severity: Severity.Critical, cveId: 'CVE-2024-1' },
                    { ruleId: 'CVE-2024-2', message: 'High issue', severity: Severity.High, cveId: 'CVE-2024-2' }
                ]
            };

            const md = generateMarkdownSummary(summary, 'fs', '/src', true);
            assert.ok(md.includes('Microsoft Defender'));
            assert.ok(md.includes('Critical'));
            assert.ok(md.includes('CVE-2024-1'));
            assert.ok(md.includes('❌'));
        });

        it('should show passing status when no critical/high findings', () => {
            const summary = {
                total: 1,
                critical: 0,
                high: 0,
                medium: 1,
                low: 0,
                unknown: 0,
                vulnerabilities: [
                    { ruleId: 'r1', message: 'Medium issue', severity: Severity.Medium }
                ]
            };

            const md = generateMarkdownSummary(summary, 'image', 'nginx:latest', false);
            assert.ok(md.includes('✅'));
            assert.ok(md.includes('Passed'));
        });
    });

    describe('generateNoFindingsSummary', () => {
        it('should generate clean scan summary', () => {
            const md = generateNoFindingsSummary('fs', '/src');
            assert.ok(md.includes('No vulnerabilities found'));
            assert.ok(md.includes('Filesystem'));
            assert.ok(md.includes('✅'));
        });

        it('should format image scan type correctly', () => {
            const md = generateNoFindingsSummary('image', 'nginx:latest');
            assert.ok(md.includes('Container Image'));
        });

        it('should format model scan type correctly', () => {
            const md = generateNoFindingsSummary('model', '/models/test.onnx');
            assert.ok(md.includes('AI Model'));
        });
    });
});
