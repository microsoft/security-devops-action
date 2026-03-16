import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SARIF result level (severity) mappings
 */
export enum SarifLevel {
    Error = 'error',
    Warning = 'warning',
    Note = 'note',
    None = 'none'
}

/**
 * Vulnerability severity levels
 */
export enum Severity {
    Critical = 'critical',
    High = 'high',
    Medium = 'medium',
    Low = 'low',
    Unknown = 'unknown'
}

/**
 * Represents a parsed vulnerability from SARIF
 */
export interface Vulnerability {
    ruleId: string;
    message: string;
    severity: Severity;
    location?: string;
    cveId?: string;
}

/**
 * Summary statistics for vulnerabilities
 */
export interface VulnerabilitySummary {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unknown: number;
    vulnerabilities: Vulnerability[];
}

interface SarifLocation {
    physicalLocation?: {
        artifactLocation?: {
            uri?: string;
        };
        region?: {
            startLine?: number;
        };
    };
}

interface SarifResult {
    ruleId?: string;
    message?: {
        text?: string;
    };
    level?: string;
    locations?: SarifLocation[];
    properties?: {
        severity?: string;
        cveId?: string;
        [key: string]: unknown;
    };
}

interface SarifRule {
    id: string;
    shortDescription?: {
        text?: string;
    };
    defaultConfiguration?: {
        level?: string;
    };
    properties?: {
        severity?: string;
        [key: string]: unknown;
    };
}

interface SarifRun {
    tool?: {
        driver?: {
            name?: string;
            rules?: SarifRule[];
        };
    };
    results?: SarifResult[];
}

interface SarifDocument {
    $schema?: string;
    version?: string;
    runs?: SarifRun[];
}

/**
 * Maps SARIF level to severity
 */
export function mapLevelToSeverity(level: string | undefined, properties?: { severity?: string }): Severity {
    if (properties?.severity) {
        const propSeverity = properties.severity.toLowerCase();
        if (propSeverity === 'critical') return Severity.Critical;
        if (propSeverity === 'high') return Severity.High;
        if (propSeverity === 'medium') return Severity.Medium;
        if (propSeverity === 'low') return Severity.Low;
    }

    switch (level?.toLowerCase()) {
        case SarifLevel.Error:
            return Severity.High;
        case SarifLevel.Warning:
            return Severity.Medium;
        case SarifLevel.Note:
            return Severity.Low;
        case SarifLevel.None:
            return Severity.Low;
        default:
            return Severity.Unknown;
    }
}

/**
 * Extracts CVE ID from rule ID or properties
 */
export function extractCveId(ruleId: string | undefined, properties?: { cveId?: string }): string | undefined {
    if (properties?.cveId) {
        return properties.cveId;
    }

    if (ruleId) {
        const cveMatch = ruleId.match(/CVE-\d{4}-\d+/i);
        if (cveMatch) {
            return cveMatch[0].toUpperCase();
        }
    }

    return undefined;
}

/**
 * Formats a location from SARIF into a readable string
 */
export function formatLocation(locations?: SarifLocation[]): string | undefined {
    if (!locations || locations.length === 0) {
        return undefined;
    }

    const loc = locations[0];
    const uri = loc.physicalLocation?.artifactLocation?.uri;
    const line = loc.physicalLocation?.region?.startLine;

    if (uri) {
        return line ? `${uri}:${line}` : uri;
    }

    return undefined;
}

/**
 * Parses a SARIF document and extracts vulnerability information
 */
export function parseSarifContent(sarifContent: string): VulnerabilitySummary {
    const summary: VulnerabilitySummary = {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
        vulnerabilities: []
    };

    let sarif: SarifDocument;
    try {
        sarif = JSON.parse(sarifContent) as SarifDocument;
    } catch (error) {
        core.warning(`Failed to parse SARIF content: ${error}`);
        return summary;
    }

    if (!sarif.runs || sarif.runs.length === 0) {
        core.debug('No runs found in SARIF document');
        return summary;
    }

    const rulesMap = new Map<string, SarifRule>();

    for (const run of sarif.runs) {
        if (run.tool?.driver?.rules) {
            for (const rule of run.tool.driver.rules) {
                rulesMap.set(rule.id, rule);
            }
        }

        if (run.results) {
            for (const result of run.results) {
                const ruleId = result.ruleId || 'unknown';
                const rule = rulesMap.get(ruleId);

                const severity = mapLevelToSeverity(
                    result.level || rule?.defaultConfiguration?.level,
                    result.properties || rule?.properties
                );

                const vulnerability: Vulnerability = {
                    ruleId,
                    message: result.message?.text || rule?.shortDescription?.text || 'No description available',
                    severity,
                    location: formatLocation(result.locations),
                    cveId: extractCveId(ruleId, result.properties)
                };

                summary.vulnerabilities.push(vulnerability);
                summary.total++;

                switch (severity) {
                    case Severity.Critical:
                        summary.critical++;
                        break;
                    case Severity.High:
                        summary.high++;
                        break;
                    case Severity.Medium:
                        summary.medium++;
                        break;
                    case Severity.Low:
                        summary.low++;
                        break;
                    default:
                        summary.unknown++;
                }
            }
        }
    }

    return summary;
}

/**
 * Generates a markdown summary from vulnerability data
 */
export function generateMarkdownSummary(
    summary: VulnerabilitySummary,
    scanType: string,
    target: string,
    hasCriticalOrHigh: boolean
): string {
    const lines: string[] = [];

    lines.push('# Microsoft Defender for DevOps Scan Results');
    lines.push('');

    lines.push('## Summary');
    lines.push('| Severity | Count |');
    lines.push('|----------|-------|');
    lines.push(`| 🔴 Critical | ${summary.critical} |`);
    lines.push(`| 🟠 High | ${summary.high} |`);
    lines.push(`| 🟡 Medium | ${summary.medium} |`);
    lines.push(`| 🟢 Low | ${summary.low} |`);
    if (summary.unknown > 0) {
        lines.push(`| ⚪ Unknown | ${summary.unknown} |`);
    }
    lines.push('');
    lines.push(`**Total Vulnerabilities**: ${summary.total}`);
    lines.push('');

    if (summary.critical > 0 || summary.high > 0) {
        lines.push('## Critical and High Findings');

        const criticalAndHigh = summary.vulnerabilities.filter(
            v => v.severity === Severity.Critical || v.severity === Severity.High
        );

        let index = 1;
        for (const vuln of criticalAndHigh.slice(0, 20)) {
            const severityIcon = vuln.severity === Severity.Critical ? '🔴' : '🟠';
            const identifier = vuln.cveId || vuln.ruleId;
            const location = vuln.location ? ` in \`${vuln.location}\`` : '';
            lines.push(`${index}. ${severityIcon} **${identifier}** - ${vuln.message}${location}`);
            index++;
        }

        if (criticalAndHigh.length > 20) {
            lines.push(`... and ${criticalAndHigh.length - 20} more`);
        }

        lines.push('');
    }

    lines.push('## Scan Details');
    lines.push(`- **Scan Type**: ${formatScanType(scanType)}`);
    lines.push(`- **Target**: \`${target}\``);

    const statusIcon = hasCriticalOrHigh ? '❌' : '✅';
    const statusText = hasCriticalOrHigh
        ? 'Failed (Critical/High vulnerabilities found)'
        : 'Passed';
    lines.push(`- **Status**: ${statusIcon} ${statusText}`);
    lines.push('');

    lines.push('---');
    lines.push('*Generated by Microsoft Defender for DevOps*');

    return lines.join('\n');
}

/**
 * Formats the scan type for display
 */
function formatScanType(scanType: string): string {
    switch (scanType.toLowerCase()) {
        case 'fs':
            return 'Filesystem';
        case 'image':
            return 'Container Image';
        case 'model':
            return 'AI Model';
        default:
            return scanType;
    }
}

/**
 * Creates a no-results summary when no vulnerabilities are found
 */
export function generateNoFindingsSummary(scanType: string, target: string): string {
    const lines: string[] = [];

    lines.push('# Microsoft Defender for DevOps Scan Results');
    lines.push('');
    lines.push('## Summary');
    lines.push('✅ **No vulnerabilities found!**');
    lines.push('');
    lines.push('## Scan Details');
    lines.push(`- **Scan Type**: ${formatScanType(scanType)}`);
    lines.push(`- **Target**: \`${target}\``);
    lines.push('- **Status**: ✅ Passed');
    lines.push('');
    lines.push('---');
    lines.push('*Generated by Microsoft Defender for DevOps*');

    return lines.join('\n');
}

/**
 * Posts the vulnerability summary to GitHub Job Summary.
 * Reads SARIF output, parses it, generates markdown, and writes to job summary.
 */
export async function postJobSummary(
    sarifPath: string,
    scanType: string,
    target: string
): Promise<boolean> {
    try {
        core.debug(`Attempting to post job summary from SARIF: ${sarifPath}`);

        if (!fs.existsSync(sarifPath)) {
            core.warning(`SARIF file not found at ${sarifPath}. Skipping job summary.`);
            return false;
        }

        const sarifContent = fs.readFileSync(sarifPath, 'utf8');
        const summary = parseSarifContent(sarifContent);

        core.debug(`Parsed ${summary.total} vulnerabilities from SARIF`);

        const hasCriticalOrHigh = summary.critical > 0 || summary.high > 0;

        let markdown: string;
        if (summary.total === 0) {
            markdown = generateNoFindingsSummary(scanType, target);
        } else {
            markdown = generateMarkdownSummary(summary, scanType, target, hasCriticalOrHigh);
        }

        await core.summary.addRaw(markdown).write();
        core.debug('Posted summary to GitHub Job Summary');

        return true;
    } catch (error) {
        core.warning(`Failed to post job summary: ${error}`);
        return false;
    }
}
