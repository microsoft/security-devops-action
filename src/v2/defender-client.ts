import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as installer from './defender-installer';

/**
 * Scans a local filesystem directory for security vulnerabilities.
 */
export async function scanDirectory(
    directoryPath: string,
    policy?: string,
    outputPath?: string,
    successfulExitCodes?: number[],
    additionalArgs?: string[]
): Promise<void> {
    await scan('fs', directoryPath, policy, outputPath, successfulExitCodes, additionalArgs);
}

/**
 * Scans a container image for security vulnerabilities.
 */
export async function scanImage(
    imageName: string,
    policy?: string,
    outputPath?: string,
    successfulExitCodes?: number[],
    additionalArgs?: string[]
): Promise<void> {
    await scan('image', imageName, policy, outputPath, successfulExitCodes, additionalArgs);
}

/**
 * Generic scan function used by scanDirectory and scanImage.
 */
async function scan(
    scanType: string,
    target: string,
    policy?: string,
    outputPath?: string,
    successfulExitCodes?: number[],
    additionalArgs?: string[]
): Promise<void> {
    const resolvedPolicy = policy || 'mdc';
    const resolvedOutputPath = outputPath || path.join(
        process.env['RUNNER_TEMP'] || process.cwd(),
        'defender.sarif'
    );

    const inputArgs: string[] = [
        'scan',
        scanType,
        target,
        '--defender-policy',
        resolvedPolicy,
        '--defender-output',
        resolvedOutputPath
    ];

    if (additionalArgs && additionalArgs.length > 0) {
        inputArgs.push(...additionalArgs);
    }

    await runDefenderCli(inputArgs, successfulExitCodes);
}

/**
 * Executes the Defender CLI with the given arguments.
 */
async function runDefenderCli(
    inputArgs: string[],
    successfulExitCodes?: number[]
): Promise<void> {
    await setupEnvironment();

    const cliFilePath = getCliFilePath();
    if (!cliFilePath) {
        throw new Error('DEFENDER_FILEPATH environment variable is not set. Defender CLI may not be installed.');
    }

    core.debug(`Running Defender CLI: ${cliFilePath} ${inputArgs.join(' ')}`);

    // Add debug flag if runner debug is enabled
    const isDebug = process.env['RUNNER_DEBUG'] === '1' || core.isDebug();
    if (isDebug && !inputArgs.includes('--defender-debug')) {
        inputArgs.push('--defender-debug');
    }

    const exitCode = await exec.exec(cliFilePath, inputArgs, {
        ignoreReturnCode: true
    });

    const validExitCodes = successfulExitCodes || [0];

    if (!validExitCodes.includes(exitCode)) {
        throw new Error(`Defender CLI exited with an error exit code: ${exitCode}`);
    }

    core.debug(`Defender CLI completed successfully with exit code: ${exitCode}`);
}

/**
 * Sets up the environment for the Defender CLI.
 */
async function setupEnvironment(): Promise<void> {
    const toolCacheDir = process.env['RUNNER_TOOL_CACHE'] || path.join(os.homedir(), '.defender');
    const defenderDir = path.join(toolCacheDir, '_defender');

    if (!fs.existsSync(defenderDir)) {
        fs.mkdirSync(defenderDir, { recursive: true });
    }

    const packagesDirectory = process.env['DEFENDER_PACKAGES_DIRECTORY'] || path.join(defenderDir, 'packages');
    process.env['DEFENDER_PACKAGES_DIRECTORY'] = packagesDirectory;

    if (!process.env['DEFENDER_FILEPATH']) {
        const cliVersion = resolveCliVersion();
        core.debug(`Installing Defender CLI version: ${cliVersion}`);
        await installer.install(cliVersion);
    }
}

/**
 * Resolves the CLI version to install.
 */
function resolveCliVersion(): string {
    let version = process.env['DEFENDER_VERSION'] || 'latest';

    if (version.includes('*')) {
        version = 'Latest';
    }

    core.debug(`Resolved Defender CLI version: ${version}`);
    return version;
}

/**
 * Gets the Defender CLI file path from environment.
 */
function getCliFilePath(): string | undefined {
    return process.env['DEFENDER_FILEPATH'];
}
