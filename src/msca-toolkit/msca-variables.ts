import * as core from '@actions/core';

export function setup(actionDirectory: string) {
    // set up the input environment variables
    process.env.MSCA_AGENT_ACTIONDIRECTORY = actionDirectory;

    const actionFilePath = `${actionDirectory}/action.yml`;
    core.debug(`actionFilePath = ${actionFilePath}`);
    
    const actionFile = require(actionFilePath);
    
    const actionName = actionFile.name.toUpperCase();
    core.debug(`actionName = ${actionName}`);

    for (const actionInput of actionFile.inputs) {
        const inputValue = core.getInput(`${actionInput.name}`);
        if (inputValue != null) {
            const varName = `MSCAI_${actionName}_${actionInput.name.toUpperCase()}`;
            const varValue = process.env[varName];
            if (varValue == null) {
                core.debug(`Input : ${varName}`);
                process.env[varName] = inputValue;
            } else {
                core.debug(`Override : ${varName}`);
            }
        }
    }
}