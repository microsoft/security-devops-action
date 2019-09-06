import * as path from 'path';
import * as process from 'process';
import * as actionsCore from '@actions/core';
import * as actionsExec from '@actions/exec';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export class GuardianAction {
    constructor(private core: typeof actionsCore, private exec: typeof actionsExec) { }
    
    setupEnvironment(actionDirectory: string) {
        // set up the input environment variables
        process.env.GDN_AGENT_ACTIONDIRECTORY = actionDirectory;

        const actionFilePath = `${actionDirectory}/action.yml`;
        console.log(`actionFilePath = ${actionFilePath}`);

        const actionFile = yaml.safeLoad(fs.readFileSync(actionFilePath, 'utf8'));

        const actionName = actionFile.name.toUpperCase();
        console.log(`actionName = ${actionName}`);

        for (const actionInput of actionFile.inputs) {
            const inputValue = this.core.getInput(`${actionInput.name}`);
            if (inputValue != null)
            {
                const varName = `GDN_${actionName}_${actionInput.name.toUpperCase()}`;
                console.log(`Input : ${varName} = ${inputValue}`);
                process.env[varName] = inputValue;
            }
        }
    }

    async analyze() {
        const analyzeCommand = 'analyze'
        this.run(analyzeCommand);
    }

    async break() {
        const breakCommand = 'break';
        this.run(breakCommand);
    }

    async export() {
        const reportCommand = 'export';
        this.run(reportCommand);
    }

    async publish() {
        const publishCommand = 'publish';
        this.run(publishCommand);
    }

    async run(actionCommand: string) {

        const gdnActionFolder = path.resolve(__dirname);
        this.core.debug(`dirname = ${__dirname}`);

        this.setupEnvironment(actionDirectory);

        try {
            await this.exec.exec('<toolPath>', '<arguments>')
        }
        catch (error) {
            this.core.setFailed(error.Message);
        }
    }
}