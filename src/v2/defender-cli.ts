import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';
import { ScanType, Inputs, validateScanType, validateImageName, validateModelPath, validateFileSystemPath, parseAdditionalArgs, setupDebugLogging } from './defender-helpers';
import { IMicrosoftDefenderCLI } from './defender-interface';
import { scanDirectory, scanImage } from './defender-client';
import { postJobSummary } from './job-summary';

/*
 * Class for Microsoft Defender CLI functionality.
 * Mirrors AzDevOps v2's defender-cli.ts, adapted for GitHub Actions.
 */
export class MicrosoftDefenderCLI implements IMicrosoftDefenderCLI {
    readonly succeedOnError: boolean;
    private prSummaryEnabled: boolean = true;

    constructor() {
        this.succeedOnError = false;
    }

    public async runPreJob() {
        // No pre-job commands for Defender CLI scanning
    }

    public async runPostJob() {
        // No post-job commands for Defender CLI scanning
    }

    public async runMain() {
        await this.runDefenderCLI();
    }

    private async runDefenderCLI() {
        // Get debug setting early to enable verbose logging
        const debugInput = core.getInput(Inputs.Debug);
        const debug = debugInput ? debugInput.toLowerCase() === 'true' : false;
        if (debug) {
            setupDebugLogging(true);
            core.debug('Debug logging enabled');
        }

        // Get and validate scan type using 'command' input with 'fs' as default
        const command: string = core.getInput(Inputs.Command) || 'fs';
        const scanType = validateScanType(command);

        // Get pr-summary flag (defaults to true)
        const prSummaryInput = core.getInput(Inputs.PrSummary);
        this.prSummaryEnabled = prSummaryInput ? prSummaryInput.toLowerCase() !== 'false' : true;
        core.debug(`PR Summary enabled: ${this.prSummaryEnabled}`);

        // Get and parse additional arguments
        const argsInput = core.getInput(Inputs.Args) || '';
        let additionalArgs = parseAdditionalArgs(argsInput);

        let target: string;

        // Get target based on scan type and validate
        switch (scanType) {
            case ScanType.FileSystem:
                const fileSystemPath = core.getInput(Inputs.FileSystemPath) ||
                                       process.env['GITHUB_WORKSPACE'] ||
                                       process.cwd();
                target = validateFileSystemPath(fileSystemPath);
                core.debug(`Filesystem scan using directory: ${target}`);
                break;

            case ScanType.Image:
                const imageName = core.getInput(Inputs.ImageName);
                if (!imageName) {
                    throw new Error('Image name is required for image scan');
                }
                target = validateImageName(imageName);
                break;

            case ScanType.Model:
                const modelPath = core.getInput(Inputs.ModelPath);
                if (!modelPath) {
                    throw new Error('Model path is required for model scan');
                }
                target = validateModelPath(modelPath);
                break;

            default:
                throw new Error(`Unsupported scan type: ${scanType}`);
        }

        // Handle break on critical vulnerability
        const breakInput = core.getInput(Inputs.Break);
        const breakOnCritical = breakInput ? breakInput.toLowerCase() === 'true' : false;

        // Remove --defender-break from additional args if manually added
        additionalArgs = additionalArgs.filter(arg => arg !== '--defender-break');

        if (breakOnCritical) {
            additionalArgs.push('--defender-break');
            core.debug('Break on critical vulnerability enabled: adding --defender-break flag');
        }

        // Remove --defender-debug from additional args if manually added
        additionalArgs = additionalArgs.filter(arg => arg !== '--defender-debug');

        if (debug) {
            additionalArgs.push('--defender-debug');
            core.debug('Debug mode enabled: adding --defender-debug flag');
        }

        // Determine successful exit codes
        let successfulExitCodes: number[] = [0];

        // Generate output path
        const outputPath = path.join(
            process.env['RUNNER_TEMP'] || process.cwd(),
            'defender.sarif'
        );

        // Get policy from input, default to 'github'
        const policyInput: string = core.getInput(Inputs.Policy) || 'github';
        let policy: string;
        if (policyInput === 'none') {
            policy = '';
        } else {
            policy = policyInput;
        }

        // Log scan information
        core.debug(`Scan Type: ${scanType}`);
        core.debug(`Target: ${target}`);
        core.debug(`Policy: ${policy}`);
        core.debug(`Output Path: ${outputPath}`);
        if (additionalArgs.length > 0) {
            core.debug(`Additional Arguments: ${additionalArgs.join(' ')}`);
        }

        // Set environment variable to indicate execution via extension
        process.env['Defender_Extension'] = 'true';
        core.debug('Environment variable set: Defender_Extension=true');

        // Set the sarifFile output so downstream steps can reference it
        core.setOutput('sarifFile', outputPath);
        core.exportVariable('DEFENDER_SARIF_FILE', outputPath);
        core.debug(`sarifFile output set to: ${outputPath}`);

        try {
            switch (scanType) {
                case ScanType.FileSystem:
                    await scanDirectory(target, policy, outputPath, successfulExitCodes, additionalArgs);
                    break;

                case ScanType.Image:
                    await scanImage(target, policy, outputPath, successfulExitCodes, additionalArgs);
                    break;

                case ScanType.Model:
                    await this.runModelScan(target, policy, outputPath, successfulExitCodes, additionalArgs);
                    break;
            }

            if (this.prSummaryEnabled) {
                core.debug('Posting job summary...');
                await postJobSummary(outputPath, scanType, target);
            }
        } catch (error) {
            // Still try to post summary on error if enabled (for partial results)
            if (this.prSummaryEnabled) {
                try {
                    await postJobSummary(outputPath, scanType, target);
                } catch (summaryError) {
                    core.debug(`Failed to post summary after error: ${summaryError}`);
                }
            }

            core.error(`Defender CLI execution failed: ${error}`);
            throw error;
        }
    }

    /**
     * Runs a model scan using the Defender CLI directly.
     * This is needed because the defender-client doesn't export a scanModel() function.
     */
    private async runModelScan(
        modelPath: string,
        policy: string,
        outputPath: string,
        successfulExitCodes: number[],
        additionalArgs: string[]
    ): Promise<void> {
        const cliFilePath = process.env['DEFENDER_FILEPATH'];

        if (!cliFilePath) {
            throw new Error('DEFENDER_FILEPATH environment variable is not set. Defender CLI may not be installed.');
        }

        const args = [
            'scan',
            'model',
            modelPath,
        ];

        if (policy) {
            args.push('--defender-policy', policy);
        }

        args.push('--defender-output', outputPath);

        if (additionalArgs && additionalArgs.length > 0) {
            args.push(...additionalArgs);
            core.debug(`Appending additional arguments: ${additionalArgs.join(' ')}`);
        }

        // Check if debug is enabled
        const isDebug = process.env['RUNNER_DEBUG'] === '1' || core.isDebug();
        if (isDebug && !args.includes('--defender-debug')) {
            args.push('--defender-debug');
        }

        core.debug('Running Microsoft Defender CLI for model scan...');
        const exitCode = await exec.exec(cliFilePath, args, {
            ignoreReturnCode: true
        });

        let success = false;
        for (const successCode of successfulExitCodes) {
            if (exitCode === successCode) {
                success = true;
                break;
            }
        }

        if (!success) {
            throw new Error(`Defender CLI exited with an error exit code: ${exitCode}`);
        }
    }
}
