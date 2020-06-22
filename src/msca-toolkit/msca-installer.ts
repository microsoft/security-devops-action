import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

export class MscaInstaller {

    async install(cliVersion: string) {
        console.log('Installing Microsot Security Code Analysis Cli...');

        if (process.env.MSCA_FILEPATH) {
            console.log(`MSCA Cli File Path overriden by %MSCA_FILEPATH%: ${process.env.MSCA_FILEPATH}`);
            return
        }

        if (process.env.MSCA_DIRECTORY) {
            console.log(`MSCA Cli Directory overriden by %MSCA_DIRECTORY%: ${process.env.MSCA_DIRECTORY}`);

            // Set the mscai file path
            let mscaFilePath = path.join(process.env.MSCA_DIRECTORY, 'guardian');
            core.debug(`mscaFilePath = ${mscaFilePath}`);

            process.env.MSCA_FILEPATH = mscaFilePath;
            return;
        }      

        // initialize the _msca directory
        let mscaDirectory = path.resolve(path.join(process.env.GITHUB_WORKSPACE, '../../_msca'));
        core.debug(`mscaDirectory = ${mscaDirectory}`);
        this.ensureDirectory(mscaDirectory);

        let mscaPackagesDirectory = path.join(mscaDirectory, 'versions');
        core.debug(`mscaPackagesDirectory = ${mscaPackagesDirectory}`);
        this.ensureDirectory(mscaPackagesDirectory);

        let mscaVersionsDirectory = path.join(mscaPackagesDirectory, 'microsoft.security.codeanalysis.cli');
        core.debug(`mscaVersionsDirectory = ${mscaVersionsDirectory}`);

        if (this.isInstalled(mscaVersionsDirectory, cliVersion)) {
            return;
        }

        let failed = false;
        let attempts = 0;
        let maxAttempts = 2;

        do {
            failed = false;

            const mscaToolkitDirectory = path.resolve(__dirname);
            core.debug(`mscaToolkitDirectory = ${mscaToolkitDirectory}`);

            const mscaProjectFile = path.join(mscaToolkitDirectory, 'msca-toolkit.proj');
            core.debug(`mscaProjectFile = ${mscaProjectFile}`);

            let args = [
                'restore',
                mscaProjectFile,
                `/p:MscaPackageVersion=${cliVersion}`,
                '--packages',
                mscaPackagesDirectory,
                '--source',
                'https://api.nuget.org/v3/index.json'
            ];

           try {
                await exec.exec('dotnet', args);
            } catch (error) {
                core.debug(error);
                failed = true;
                attempts += 1;
                if (attempts > maxAttempts) {
                    break;
                }
            }
        } while (failed);

        this.resolvePackageDirectory(mscaVersionsDirectory, cliVersion);
    }

    ensureDirectory(directory: string) : void {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }
    }

    isInstalled(
        mscaVersionsDirectory: string,
        cliVersion: string) : boolean {
        let installed = false;

        if (cliVersion.includes("*")) {
            core.debug(`MSCA Cli version contains a latest quantifier: ${cliVersion}. Continuing with install...`);
            return installed;
        }

        this.setMscaiVariablesWithVersion(mscaVersionsDirectory, cliVersion);
        
        if (fs.existsSync(process.env.MSCA_DIRECTORY)) {
            console.log(`MSCA  Cli v${cliVersion} already installed.`);
            installed = true;
        }

        return installed;
    }

    resolvePackageDirectory(
        mscaVersionsDirectory: string,
        cliVersion: string) : void {
        if (cliVersion.includes("*")) {
            // find the latest directory
            let mscaPackageDirectory = this.findLatestVersionDirectory(mscaVersionsDirectory);
            this.setMscaiVariables(mscaPackageDirectory);
        } else {
            this.setMscaiVariablesWithVersion(mscaVersionsDirectory, cliVersion);
        }

        if (!fs.existsSync(process.env.MSCA_DIRECTORY)) {
            throw `Microsoft Security Code Analysis Cli v${cliVersion} was not found after installation.`
        }
    }

    findLatestVersionDirectory(
        mscaVersionsDirectory: string,
        isPreRelease: boolean = false) : string {

        let latestDirectory = null;
        let latestVersionParts = null;
        let latestIsPreRelease = false;
        let latestPreReleaseFlag = null;

        // Get all of the directories in the versions directory
        core.debug(`Searching for all version folders in: ${mscaVersionsDirectory}`);
        let dirs = this.getDirectories(mscaVersionsDirectory);

        // Evaluate each directory
        for (let dirIndex = 0; dirIndex < dirs.length; dirIndex++) {
            let dir = dirs[dirIndex];

            if (dir == null || dir == "") {
                core.debug(`Skipping null or empty directory: ${dir}`);
                continue;
            }

            core.debug(`Evaluating mscai directory: ${dir}`);
            // If we reuse the same RegExp object, it will return null every other call
            const dirRegex = new RegExp(/^(\d+\.?){1,6}(\-\w+)?$/g);
            if (dirRegex.exec(dir) == null) {
                core.debug(`Skipping invalid version directory: ${dir}`);
                continue;
            }

            let fullVersionParts = dir.split("-");

            if (fullVersionParts == null || fullVersionParts.length < 0 || fullVersionParts.length > 2) {
                core.debug(`Skipping invalid version directory: ${dir}`);
            }

            let dirIsPreRelease = fullVersionParts.length > 1;

            if (!isPreRelease && dirIsPreRelease) {
                core.debug(`Skipping pre-release version directory: ${dir}`);
                continue;
            }

            let dirPreReleaseFlag = null;
            if (dirIsPreRelease) {
                dirPreReleaseFlag = fullVersionParts[1];
            }

            let versionNumbersString = fullVersionParts[0];

            let versionParts = dir.split(".");

            // If the latestDirectory isn't set yet, the folder is the latest directory
            let isLatest = latestDirectory == null || latestVersionParts == null;

            if (!isLatest) {
                // Evaluate the directory's version against the latest directory

                // Handle comparisions of separate level versions
                // Some packages exclude Patch or include Revisions up to two levels (Rev1 and Rev2)
                let maxVersionParts = versionParts.length;
                if (latestVersionParts.length > maxVersionParts) {
                    maxVersionParts = latestVersionParts.length;
                }

                for (let versionPartIndex = 0; versionPartIndex < versionParts.length; versionPartIndex++) {
                    let versionPart = 0;
                    let latestVersionPart = 0;

                    let isLastVersionPart = versionPartIndex == (maxVersionParts - 1);

                    if (versionPartIndex < versionParts.length) {
                        versionPart = parseInt(versionParts[versionPartIndex]);
                    }

                    if (versionPartIndex < latestVersionParts.length) {
                        latestVersionPart = parseInt(latestVersionParts[versionPartIndex]);
                    }

                    if (versionPart > latestVersionPart) {
                        isLatest = true;
                    } else if (versionPart == latestVersionPart) {
                        isLatest = isLastVersionPart
                            &&
                            (
                                (isPreRelease && latestIsPreRelease && dirPreReleaseFlag > latestPreReleaseFlag)
                                ||
                                (!isPreRelease && latestIsPreRelease)
                            );
                    } else {
                        // Current version is less than latest found
                        break;
                    }

                    if (isLatest) {
                        break;
                    }
                }
            }

            if (isLatest) {
                core.debug(`Setting latest version directory: ${dir}`);
                latestDirectory = path.join(mscaVersionsDirectory, dir);
                latestVersionParts = versionParts;
                latestIsPreRelease = dirIsPreRelease;
                latestPreReleaseFlag = dirPreReleaseFlag;
            }
        }

        core.debug(`latestDirectory = ${latestDirectory}`);

        return latestDirectory;
    }

    getDirectories(directory: string) : string[] {
        // read the directory for all paths
        // filter for directories
        return fs.readdirSync(directory).filter(p => this.isDirectory(directory, p));
    }

    isDirectory(directory: string, p: string) : boolean {
        // statSync follows symlinks
        return fs.statSync(path.join(directory, p)).isDirectory();
    }

    setMscaiVariablesWithVersion(
        mscaVersionsDirectory: string,
        cliVersion: string) : void {

        let mscaPackageDirectory = path.join(mscaVersionsDirectory, cliVersion)
        core.debug(`mscaPackageDirectory = ${mscaPackageDirectory}`);

        this.setMscaiVariables(mscaPackageDirectory);
    }

    setMscaiVariables(mscaPackageDirectory: string) : void {
        let mscaDirectory = path.join(mscaPackageDirectory, 'tools');
        core.debug(`mscaDirectory = ${mscaDirectory}`);

        let mscaFilePath = path.join(mscaDirectory, 'guardian');
        core.debug(`mscaFilePath = ${mscaFilePath}`);

        process.env.MSCA_DIRECTORY = mscaDirectory;
        process.env.MSCA_FILEPATH = mscaFilePath;
    }
}