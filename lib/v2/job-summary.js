"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postJobSummary = exports.generateNoFindingsSummary = exports.generateMarkdownSummary = exports.parseSarifContent = exports.formatLocation = exports.extractCveId = exports.mapLevelToSeverity = exports.Severity = exports.SarifLevel = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
var SarifLevel;
(function (SarifLevel) {
    SarifLevel["Error"] = "error";
    SarifLevel["Warning"] = "warning";
    SarifLevel["Note"] = "note";
    SarifLevel["None"] = "none";
})(SarifLevel || (exports.SarifLevel = SarifLevel = {}));
var Severity;
(function (Severity) {
    Severity["Critical"] = "critical";
    Severity["High"] = "high";
    Severity["Medium"] = "medium";
    Severity["Low"] = "low";
    Severity["Unknown"] = "unknown";
})(Severity || (exports.Severity = Severity = {}));
function mapLevelToSeverity(level, properties) {
    if (properties === null || properties === void 0 ? void 0 : properties.severity) {
        const propSeverity = properties.severity.toLowerCase();
        if (propSeverity === 'critical')
            return Severity.Critical;
        if (propSeverity === 'high')
            return Severity.High;
        if (propSeverity === 'medium')
            return Severity.Medium;
        if (propSeverity === 'low')
            return Severity.Low;
    }
    switch (level === null || level === void 0 ? void 0 : level.toLowerCase()) {
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
exports.mapLevelToSeverity = mapLevelToSeverity;
function extractCveId(ruleId, properties) {
    if (properties === null || properties === void 0 ? void 0 : properties.cveId) {
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
exports.extractCveId = extractCveId;
function formatLocation(locations) {
    var _a, _b, _c, _d;
    if (!locations || locations.length === 0) {
        return undefined;
    }
    const loc = locations[0];
    const uri = (_b = (_a = loc.physicalLocation) === null || _a === void 0 ? void 0 : _a.artifactLocation) === null || _b === void 0 ? void 0 : _b.uri;
    const line = (_d = (_c = loc.physicalLocation) === null || _c === void 0 ? void 0 : _c.region) === null || _d === void 0 ? void 0 : _d.startLine;
    if (uri) {
        return line ? `${uri}:${line}` : uri;
    }
    return undefined;
}
exports.formatLocation = formatLocation;
function parseSarifContent(sarifContent) {
    var _a, _b, _c, _d, _e;
    const summary = {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
        vulnerabilities: []
    };
    let sarif;
    try {
        sarif = JSON.parse(sarifContent);
    }
    catch (error) {
        core.warning(`Failed to parse SARIF content: ${error}`);
        return summary;
    }
    if (!sarif.runs || sarif.runs.length === 0) {
        core.debug('No runs found in SARIF document');
        return summary;
    }
    const rulesMap = new Map();
    for (const run of sarif.runs) {
        if ((_b = (_a = run.tool) === null || _a === void 0 ? void 0 : _a.driver) === null || _b === void 0 ? void 0 : _b.rules) {
            for (const rule of run.tool.driver.rules) {
                rulesMap.set(rule.id, rule);
            }
        }
        if (run.results) {
            for (const result of run.results) {
                const ruleId = result.ruleId || 'unknown';
                const rule = rulesMap.get(ruleId);
                const severity = mapLevelToSeverity(result.level || ((_c = rule === null || rule === void 0 ? void 0 : rule.defaultConfiguration) === null || _c === void 0 ? void 0 : _c.level), result.properties || (rule === null || rule === void 0 ? void 0 : rule.properties));
                const vulnerability = {
                    ruleId,
                    message: ((_d = result.message) === null || _d === void 0 ? void 0 : _d.text) || ((_e = rule === null || rule === void 0 ? void 0 : rule.shortDescription) === null || _e === void 0 ? void 0 : _e.text) || 'No description available',
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
exports.parseSarifContent = parseSarifContent;
function generateMarkdownSummary(summary, scanType, target, hasCriticalOrHigh) {
    const lines = [];
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
        const criticalAndHigh = summary.vulnerabilities.filter(v => v.severity === Severity.Critical || v.severity === Severity.High);
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
exports.generateMarkdownSummary = generateMarkdownSummary;
function formatScanType(scanType) {
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
function generateNoFindingsSummary(scanType, target) {
    const lines = [];
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
exports.generateNoFindingsSummary = generateNoFindingsSummary;
function postJobSummary(sarifPath, scanType, target) {
    return __awaiter(this, void 0, void 0, function* () {
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
            let markdown;
            if (summary.total === 0) {
                markdown = generateNoFindingsSummary(scanType, target);
            }
            else {
                markdown = generateMarkdownSummary(summary, scanType, target, hasCriticalOrHigh);
            }
            yield core.summary.addRaw(markdown).write();
            core.debug('Posted summary to GitHub Job Summary');
            return true;
        }
        catch (error) {
            core.warning(`Failed to post job summary: ${error}`);
            return false;
        }
    });
}
exports.postJobSummary = postJobSummary;
