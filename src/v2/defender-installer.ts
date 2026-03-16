import * as core from '@actions/core';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import * as path from 'path';
import * as os from 'os';

const downloadBaseUrl = 'https://cli.dfd.security.azure.com/public';
const maxRetries = 3;
const downloadTimeoutMs = 30000;

/**
 * Installs the Defender CLI if not already present.
 * @param cliVersion - The version of the CLI to install (default: 'latest')
 */
export async function install(cliVersion: string = 'latest'): Promise<void> {
    // If DEFENDER_FILEPATH is already set and the file exists, skip installation
    const existingPath = process.env['DEFENDER_FILEPATH'];
    if (existingPath && fs.existsSync(existingPath)) {
        core.debug(`Defender CLI already installed at: ${existingPath}`);
        return;
    }

    // Check if DEFENDER_DIRECTORY is set (pre-installed CLI)
    const existingDir = process.env['DEFENDER_DIRECTORY'];
    if (existingDir && fs.existsSync(existingDir)) {
        const fileName = resolveFileName();
        const filePath = path.join(existingDir, fileName);
        if (fs.existsSync(filePath)) {
            core.debug(`Found pre-installed Defender CLI at: ${filePath}`);
            setVariables(existingDir, fileName, cliVersion);
            return;
        }
    }

    // Determine packages directory
    const toolCacheDir = process.env['RUNNER_TOOL_CACHE'] || path.join(os.homedir(), '.defender');
    const packagesDirectory = process.env['DEFENDER_PACKAGES_DIRECTORY'] || path.join(toolCacheDir, '_defender', 'packages');

    if (!fs.existsSync(packagesDirectory)) {
        fs.mkdirSync(packagesDirectory, { recursive: true });
    }

    const fileName = resolveFileName();

    // Retry download up to maxRetries times
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            core.info(`Downloading Defender CLI (attempt ${attempt}/${maxRetries})...`);
            await downloadDefenderCli(packagesDirectory, fileName, cliVersion);
            setVariables(packagesDirectory, fileName, cliVersion, true);
            core.info(`Defender CLI installed successfully.`);
            return;
        } catch (error) {
            lastError = error as Error;
            core.warning(`Download attempt ${attempt} failed: ${lastError.message}`);
            if (attempt < maxRetries) {
                core.info('Retrying...');
            }
        }
    }

    throw new Error(`Failed to install Defender CLI after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Downloads the Defender CLI binary.
 */
async function downloadDefenderCli(
    packagesDirectory: string,
    fileName: string,
    cliVersion: string
): Promise<void> {
    const versionDir = path.join(packagesDirectory, `defender-cli.${cliVersion}`);
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
    }

    const filePath = path.join(versionDir, fileName);
    const downloadUrl = `${downloadBaseUrl}/${cliVersion.toLowerCase()}/${fileName}`;

    core.debug(`Downloading from: ${downloadUrl}`);
    core.debug(`Saving to: ${filePath}`);

    await downloadFile(downloadUrl, filePath);

    // Make executable on non-Windows platforms
    if (process.platform !== 'win32') {
        fs.chmodSync(filePath, 0o755);
    }
}

/**
 * Downloads a file from a URL, following redirects.
 */
function downloadFile(url: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        const request = https.get(url, { timeout: downloadTimeoutMs }, (response) => {
            // Follow redirects (301, 302)
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(filePath);
                const redirectUrl = response.headers.location;
                if (!redirectUrl) {
                    return reject(new Error('Redirect without location header'));
                }
                core.debug(`Following redirect to: ${redirectUrl}`);
                downloadFile(redirectUrl, filePath).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(filePath);
                return reject(new Error(`Download failed with status code: ${response.statusCode}`));
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });

        request.on('error', (error) => {
            file.close();
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            reject(new Error(`Download error: ${error.message}`));
        });

        request.on('timeout', () => {
            request.destroy();
            file.close();
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            reject(new Error('Download timed out'));
        });
    });
}

/**
 * Resolves the platform-specific Defender CLI binary filename.
 */
export function resolveFileName(): string {
    const platform = os.platform();
    const arch = os.arch();

    switch (platform) {
        case 'win32':
            if (arch === 'arm64') return 'Defender_win-arm64.exe';
            if (arch === 'ia32' || arch === 'x32') return 'Defender_win-x86.exe';
            return 'Defender_win-x64.exe';
        case 'linux':
            if (arch === 'arm64') return 'Defender_linux-arm64';
            return 'Defender_linux-x64';
        case 'darwin':
            if (arch === 'arm64') return 'Defender_osx-arm64';
            return 'Defender_osx-x64';
        default:
            core.warning(`Unknown platform: ${platform}. Defaulting to linux-x64.`);
            return 'Defender_linux-x64';
    }
}

/**
 * Sets environment variables for the Defender CLI location.
 */
export function setVariables(
    packagesDirectory: string,
    fileName: string,
    cliVersion: string,
    validate: boolean = false
): void {
    const defenderDir = path.join(packagesDirectory, `defender-cli.${cliVersion}`);
    const defenderFilePath = path.join(defenderDir, fileName);

    if (validate && !fs.existsSync(defenderFilePath)) {
        throw new Error(`Defender CLI not found after download: ${defenderFilePath}`);
    }

    process.env['DEFENDER_DIRECTORY'] = defenderDir;
    process.env['DEFENDER_FILEPATH'] = defenderFilePath;
    process.env['DEFENDER_INSTALLEDVERSION'] = cliVersion;

    core.debug(`DEFENDER_DIRECTORY=${defenderDir}`);
    core.debug(`DEFENDER_FILEPATH=${defenderFilePath}`);
    core.debug(`DEFENDER_INSTALLEDVERSION=${cliVersion}`);
}
