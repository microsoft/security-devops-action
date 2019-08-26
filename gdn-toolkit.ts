import * as path from 'path';
import * as process from 'process';
import * as actionsCore from '@actions/core';
import * as actionsExec from '@actions/exec';

export class GuardianAction {
	constructor(private core: typeof actionsCore, private exec: typeof actionsExec) { }
	
	setupEnvironment(actionDirectory: string) {
		// set up the input environment variables
		process.env.GDN_AGENT_ACTIONDIRECTORY = actionDirectory;

		let actionYamlFile = require(`${actionDirectory}/action.yml`);
		console.log(`actionYamlFile = ${actionYamlFile}`);

		for (let actionInput of actionYamlFile.inputs) {
			let inputValue = this.core.getInput(`${actionInput.name}`);
			if (inputValue != null)
			{
				let varName = "GDN_INPUT_" + actionInput.name.toUpperCase();
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