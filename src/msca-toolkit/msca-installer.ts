import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import * as tl from 'azure-pipelines-task-lib/task';
import { GuardianAccessor } from './msca-access'
import { GuardianNuGetConfigCreator } from './msca-nuget'

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
            tl.debug(`mscaiFilePath = ${mscaiFilePath}`);

            process.env.MSCAI_FILEPATH = mscaiFilePath;
            return;
        }      

        // initialize the _msca directory
        let mscaDirectory = path.join(process.env.AGENT_ROOTDIRECTORY, '_msca');
        tl.debug(`mscaDirectory = ${mscaDirectory}`);
        this.ensureDirectory(mscaDirectory);

        let mscaiPackagesDirectory = path.join(mscaDirectory, 'mscai');
        tl.debug(`mscaiPackagesDirectory = ${mscaiPackagesDirectory}`);
        this.ensureDirectory(mscaiPackagesDirectory);

        let mscaiVersionsDirectory = path.join(mscaiPackagesDirectory, 'microsoft.security.codeanalysis.integration.cli');
        tl.debug(`mscaiVersionsDirectory = ${mscaiVersionsDirectory}`);

        if (this.isInstalled(mscaiVersionsDirectory, integrationCliVersion)) {
            return;
        }

        let failed = false;
        let attempts = 0;

        do {
            failed = false;

            const mscaActionFolder = path.resolve(__dirname);
            tl.debug(`mscaActionFolder = ${__dirname}`);

            const mmscaiProjectFile = path.join(mscaActionFolder, 'msca-task-lib.proj');
            tl.debug(`mmscaiProjectFile = ${mmscaiProjectFile}`);

            let tool = tl.tool('dotnet')
                .arg('restore')
                .arg(mmscaiProjectFile)
                .arg(`/p:MicrosoftSecurityCodeAnalysisIntegrationCliVersion=${integrationCliVersion}`)
                .arg("--packages")
                .arg(mscaiPackagesDirectory)
                .arg("--source")
                .arg("https://api.nuget.org/v3/index.json");

           try {
                await tool.exec();
            } catch (error) {
                tl.debug(error);
                failed = true;
                attempts += 1;
                if (attempts > accessTokens.length) {
                    break;
                }
            } finally {
                // delete the nuget config file
                fs.unlinkSync(nugetConfigPath);
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
            tl.debug(`Pipeline version contains a latest quantifier: ${integrationCliVersion}. Continuing with install...`);
            return installed;
        }

        this.setmscaiVariablesWithVersion(mscaiVersionsDirectory, integrationCliVersion);
        
        if (fs.existsSync(process.env.MSCAI_DIRECTORY)) {
            console.log(`Guardian Pipeline v${integrationCliVersion} already installed.`);
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
            this.setmscaiVariables(mscaiPackageDirectory);
        } else {
            this.setmscaiVariablesWithVersion(mscaiVersionsDirectory, integrationCliVersion);
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
        tl.debug(`Searching for all version folders in: ${mscaiVersionsDirectory}`);
        let dirs = this.getDirectories(mscaiVersionsDirectory);

        // Evaluate each directory
        for (let dirIndex = 0; dirIndex < dirs.length; dirIndex++) {
            let dir = dirs[dirIndex];

            if (dir == null || dir == "") {
                tl.debug(`Skipping null or empty directory: ${dir}`);
                continue;
            }

            tl.debug(`Evaluating mscai directory: ${dir}`);
            // If we reuse the same RegExp object, it will return null every other call
            const dirRegex = new RegExp(/^(\d+\.?){1,6}(\-\w+)?$/g);
            if (dirRegex.exec(dir) == null) {
                tl.debug(`Skipping invalid version directory: ${dir}`);
                continue;
            }

            let fullVersionParts = dir.split("-");

            if (fullVersionParts == null || fullVersionParts.length < 0 || fullVersionParts.length > 2) {
                tl.debug(`Skipping invalid version directory: ${dir}`);
            }

            let dirIsPreRelease = fullVersionParts.length > 1;

            if (!isPreRelease && dirIsPreRelease) {
                tl.debug(`Skipping pre-release version directory: ${dir}`);
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
                tl.debug(`Setting latest version directory: ${dir}`);
                latestDirectory = path.join(mscaiVersionsDirectory, dir);
                latestVersionParts = versionParts;
                latestIsPreRelease = dirIsPreRelease;
                latestPreReleaseFlag = dirPreReleaseFlag;
            }
        }

        tl.debug(`latestDirectory = ${latestDirectory}`);

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

    setmscaiVariablesWithVersion(
        mscaiVersionsDirectory: string,
        integrationCliVersion: string) : void {

        let mscaiPackageDirectory = path.join(mscaiVersionsDirectory, integrationCliVersion)
        tl.debug(`mscaiPackageDirectory = ${mscaiPackageDirectory}`);

        this.setmscaiVariables(mscaiPackageDirectory);
    }

    setmscaiVariables(mscaiPackageDirectory: string) : void {
        let mscaiDirectory = path.join(mscaiPackageDirectory, 'tools');
        tl.debug(`mscaiDirectory = ${mscaiDirectory}`);

        let mscaiFilePath = path.join(mscaiDirectory, 'mscai');
        tl.debug(`mscaiFilePath = ${mscaiFilePath}`);

        process.env.MSCAI_DIRECTORY = mscaiDirectory;
        process.env.MSCAI_FILEPATH = mscaiFilePath;
    }
}