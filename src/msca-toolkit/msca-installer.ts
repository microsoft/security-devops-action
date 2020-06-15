import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

export class MicrosoftSecurityCodeAnalysisCliInstaller {

    async install(integrationCliVersion: string) {
        console.log('Installing Microsot Security Code Analysis Integration Cli...');

        if (process.env.MSCAI_FILEPATH) {
            console.log(`MSCA Integration Cli File Path overriden by %MSCAI_FILEPATH%: ${process.env.MSCAI_FILEPATH}`);
            return
        }

        if (process.env.MSCAI_DIRECTORY) {
            console.log(`MSCA Integration Cli Directory overriden by %MSCAI_DIRECTORY%: ${process.env.MSCAI_DIRECTORY}`);

            // Set the mscai file path
            let mscaiFilePath = path.join(process.env.MSCAI_DIRECTORY, 'mscai');
            core.debug(`mscaiFilePath = ${mscaiFilePath}`);

            process.env.MSCAI_FILEPATH = mscaiFilePath;
            return;
        }      

        // initialize the _msca directory
        let mscaDirectory = path.join(process.env.AGENT_ROOTDIRECTORY, '_msca');
        core.debug(`mscaDirectory = ${mscaDirectory}`);
        this.ensureDirectory(mscaDirectory);

        let mscaiPackagesDirectory = path.join(mscaDirectory, 'mscai');
        core.debug(`mscaiPackagesDirectory = ${mscaiPackagesDirectory}`);
        this.ensureDirectory(mscaiPackagesDirectory);

        let mscaiVersionsDirectory = path.join(mscaiPackagesDirectory, 'microsoft.security.codeanalysis.integration.cli');
        core.debug(`mscaiVersionsDirectory = ${mscaiVersionsDirectory}`);

        if (this.isInstalled(mscaiVersionsDirectory, integrationCliVersion)) {
            return;
        }

        let failed = false;
        let attempts = 0;

        do {
            failed = false;

            const mscaActionFolder = path.resolve(__dirname);
            core.debug(`mscaActionFolder = ${__dirname}`);

            const mscaProjectFile = path.join(mscaActionFolder, 'msca-toolkit.proj');
            core.debug(`mscaProjectFile = ${mscaProjectFile}`);

            let args = [
                'restore',
                mscaProjectFile,
                `/p:MicrosoftSecurityCodeAnalysisIntegrationCliVersion=${integrationCliVersion}`,
                '--packages',
                mscaiPackagesDirectory
                '--source',
                'https://api.nuget.org/v3/index.json'
            ];

            let tool = exec.exec('dotnet', args);

           try {
                await tool.exec();
            } catch (error) {
                core.debug(error);
                failed = true;
                attempts += 1;
                if (attempts > accessTokens.length) {
                    break;
                }
            }
        } while (failed);

        this.resolvePackageDirectory(mscaiVersionsDirectory, integrationCliVersion);
    }

    ensureDirectory(directory: string) : void {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }
    }

    isInstalled(
        mscaiVersionsDirectory: string,
        integrationCliVersion: string) : boolean {
        let installed = false;

        if (integrationCliVersion.includes("*")) {
            core.debug(`Integration Cli version contains a latest quantifier: ${integrationCliVersion}. Continuing with install...`);
            return installed;
        }

        this.setMscaiVariablesWithVersion(mscaiVersionsDirectory, integrationCliVersion);
        
        if (fs.existsSync(process.env.MSCAI_DIRECTORY)) {
            console.log(`Integration Cli v${integrationCliVersion} already installed.`);
            installed = true;
        }

        return installed;
    }

    resolvePackageDirectory(
        mscaiVersionsDirectory: string,
        integrationCliVersion: string) : void {
        if (integrationCliVersion.includes("*")) {
            // find the latest directory
            let mscaiPackageDirectory = this.findLatestVersionDirectory(mscaiVersionsDirectory);
            this.setMscaiVariables(mscaiPackageDirectory);
        } else {
            this.setMscaiVariablesWithVersion(mscaiVersionsDirectory, integrationCliVersion);
        }

        if (!fs.existsSync(process.env.MSCAI_DIRECTORY)) {
            throw `Guardian Pipeline v${integrationCliVersion} was not found after installation.`
        }
    }

    findLatestVersionDirectory(mscaiVersionsDirectory: string, isPreRelease: boolean = false) : string {

        let latestDirectory = null;
        let latestVersionParts = null;
        let latestIsPreRelease = false;
        let latestPreReleaseFlag = null;

        // Get all of the directories in the versions directory
        core.debug(`Searching for all version folders in: ${mscaiVersionsDirectory}`);
        let dirs = this.getDirectories(mscaiVersionsDirectory);

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
            let isLatest = latestDirectory == null;

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
                latestDirectory = path.join(mscaiVersionsDirectory, dir);
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
        mscaiVersionsDirectory: string,
        integrationCliVersion: string) : void {

        let mscaiPackageDirectory = path.join(mscaiVersionsDirectory, integrationCliVersion)
        core.debug(`mscaiPackageDirectory = ${mscaiPackageDirectory}`);

        this.setMscaiVariables(mscaiPackageDirectory);
    }

    setMscaiVariables(mscaiPackageDirectory: string) : void {
        let mscaiDirectory = path.join(mscaiPackageDirectory, 'tools');
        core.debug(`mscaiDirectory = ${mscaiDirectory}`);

        let mscaiFilePath = path.join(mscaiDirectory, 'mscai');
        core.debug(`mscaiFilePath = ${mscaiFilePath}`);

        process.env.MSCAI_DIRECTORY = mscaiDirectory;
        process.env.MSCAI_FILEPATH = mscaiFilePath;
    }
}