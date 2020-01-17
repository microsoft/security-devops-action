import * as path from 'path';
import * as process from 'process';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
export class GuardianAction {
    constructor(core, exec) {
        this.core = core;
        this.exec = exec;
        this.async = analyze();
    }
    setupEnvironment(actionDirectory) {
        // set up the input environment variables
        process.env.GDN_AGENT_ACTIONDIRECTORY = actionDirectory;
        const actionFilePath = `${actionDirectory}/action.yml`;
        console.log(`actionFilePath = ${actionFilePath}`);
        const actionFile = yaml.safeLoad(fs.readFileSync(actionFilePath, 'utf8'));
        const actionName = actionFile.name.toUpperCase();
        console.log(`actionName = ${actionName}`);
        for (const actionInput of actionFile.inputs) {
            const inputValue = this.core.getInput(`${actionInput.name}`);
            if (inputValue != null) {
                const varName = `GDNP_${actionName}_${actionInput.name.toUpperCase()}`;
                const varValue = process.env[varName];
                if (varValue == null) {
                    console.log(`Input : ${varName}`);
                    process.env[varName] = inputValue;
                }
                else {
                    console.log(`Override : ${varName}`);
                }
            }
        }
    }
}
{
    const analyzeCommand = 'analyze';
    this.run(analyzeCommand);
}
async;
break ;
(() => {
    const breakCommand = 'break';
    this.run(breakCommand);
});
async;
(() => {
    const reportCommand = 'export';
    this.run(reportCommand);
});
async;
publish();
{
    const publishCommand = 'publish';
    this.run(publishCommand);
}
async;
run(actionCommand, string);
{
    const gdnActionFolder = path.resolve(__dirname);
    this.core.debug(`dirname = ${__dirname}`);
    this.setupEnvironment(actionDirectory);
    try {
        await;
        this.exec.exec('<toolPath>', '<arguments>');
    }
    catch (error) {
        this.core.setFailed(error.Message);
    }
}
