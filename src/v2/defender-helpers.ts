import * as core from '@actions/core';
import * as fs from 'fs';
import * as os from 'os';
import { Writable } from 'stream';

/**
 * Enum for the possible inputs for the task (specified in action.yml)
 */
export enum Inputs {
    Command = 'command',
    Args = 'args',
    FileSystemPath = 'fileSystemPath',
    ImageName = 'imageName',
    ModelPath = 'modelPath',
    Break = 'break',
    Debug = 'debug',
    PrSummary = 'pr-summary',
    Policy = 'policy'
}

/*
 * Enum for the possible scan type values for the Inputs.Command
 */
export enum ScanType {
    FileSystem = 'fs',
    Image = 'image',
    Model = 'model'
}

/**
 * Enum for defining constants used in the task.
 */
export enum Constants {
    Unknown = 'unknown',
    PreJobStartTime = 'PREJOBSTARTTIME',
    DefenderExecutable = 'Defender'
}

/**
 * Validates the scan type input and returns the corresponding enum value.
 */
export function validateScanType(scanTypeInput: string): ScanType {
    const scanType = scanTypeInput as ScanType;
    if (!Object.values(ScanType).includes(scanType)) {
        throw new Error(`Invalid scan type: ${scanTypeInput}. Valid options are: ${Object.values(ScanType).join(', ')}`);
    }
    return scanType;
}

/**
 * Validates the filesystem path input for filesystem scans.
 */
export function validateFileSystemPath(fsPath: string): string {
    if (!fsPath || fsPath.trim() === '') {
        throw new Error('Filesystem path cannot be empty for filesystem scan');
    }

    const trimmedPath = fsPath.trim();

    if (!fs.existsSync(trimmedPath)) {
        throw new Error(`Filesystem path does not exist: ${trimmedPath}`);
    }

    return trimmedPath;
}

/**
 * Checks if a given string is a URL (http:// or https://).
 */
export function isUrl(input: string): boolean {
    if (!input) {
        return false;
    }
    const lowercased = input.toLowerCase();
    return lowercased.startsWith('http://') || lowercased.startsWith('https://');
}

/**
 * Validates a URL for model scanning.
 */
export function validateModelUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            throw new Error(`Invalid URL protocol: ${parsedUrl.protocol}. Only http:// and https:// are supported.`);
        }

        if (!parsedUrl.hostname) {
            throw new Error('URL must have a valid hostname.');
        }

        return url;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(`Invalid URL format: ${url}`);
        }
        throw error;
    }
}

/**
 * Validates the model path input for AI model scans.
 * Supports both local file paths and URLs.
 */
export function validateModelPath(modelPath: string): string {
    if (!modelPath || modelPath.trim() === '') {
        throw new Error('Model path cannot be empty for model scan');
    }

    const trimmedPath = modelPath.trim();

    if (isUrl(trimmedPath)) {
        return validateModelUrl(trimmedPath);
    }

    if (!fs.existsSync(trimmedPath)) {
        throw new Error(`Model path does not exist: ${trimmedPath}`);
    }

    const stats = fs.statSync(trimmedPath);
    if (!stats.isFile() && !stats.isDirectory()) {
        throw new Error(`Model path must be a file or directory: ${trimmedPath}`);
    }

    return trimmedPath;
}

/**
 * Validates the image name input for container image scans.
 */
export function validateImageName(imageName: string): string {
    if (!imageName || imageName.trim() === '') {
        throw new Error('Image name cannot be empty for image scan');
    }

    const trimmedImageName = imageName.trim();

    const imageNameRegex = /^(?:(?:[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*(?::[0-9]+)?\/)?[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*)(?::[a-zA-Z0-9._-]+|@sha256:[a-fA-F0-9]{64})?$/;

    if (!imageNameRegex.test(trimmedImageName)) {
        throw new Error(`Invalid image name format: ${trimmedImageName}. Image name should follow container image naming conventions.`);
    }

    return trimmedImageName;
}

/**
 * Sets up debug logging. When enabled, sets RUNNER_DEBUG to enable verbose logging.
 */
export function setupDebugLogging(enabled: boolean): void {
    if (enabled) {
        process.env['RUNNER_DEBUG'] = '1';
        core.debug('Debug logging enabled');
    }
}

/**
 * Writes the specified data to the specified output stream, followed by the platform-specific end-of-line character.
 */
export function writeToOutStream(data: string, outStream: Writable = process.stdout): void {
    outStream.write(data.trim() + os.EOL);
}

/**
 * Encodes a string to base64.
 */
export const encode = (str: string): string => Buffer.from(str, 'binary').toString('base64');

/**
 * Returns the encoded content of the Docker version, Docker events, and Docker images.
 */
export function getEncodedContent(
    dockerVersion: string,
    dockerEvents: string,
    dockerImages: string
): string {
    let data: string[] = [];
    data.push('DockerVersion: ' + dockerVersion);
    data.push('DockerEvents:');
    data.push(dockerEvents);
    data.push('DockerImages:');
    data.push(dockerImages);
    return encode(data.join(os.EOL));
}

/**
 * Parses additional CLI arguments from a string into an array.
 * Handles quoted strings and splits on whitespace.
 */
export function parseAdditionalArgs(additionalArgs: string | undefined): string[] {
    if (!additionalArgs || additionalArgs.trim() === '') {
        return [];
    }

    const args: string[] = [];
    const trimmedArgs = additionalArgs.trim();

    const regex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
    const matches = trimmedArgs.match(regex);

    if (matches) {
        for (const match of matches) {
            let arg = match;
            if ((arg.startsWith('"') && arg.endsWith('"')) ||
                (arg.startsWith("'") && arg.endsWith("'"))) {
                arg = arg.slice(1, -1);
            }
            args.push(arg);
        }
    }

    core.debug(`Parsed additional arguments: ${JSON.stringify(args)}`);
    return args;
}
