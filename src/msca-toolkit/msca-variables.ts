import * as core from '@actions/core';

export function setup(actionDirectory: string) {
    // set up the input environment variables
    process.env.MSCA_AGENT_ACTIONDIRECTORY = actionDirectory;

    const actionFilePath = `${actionDirectory}/task.json`;
    core.debug(`actionFilePath = ${actionFilePath}`);
    
    const actionFile = require(actionFilePath);
    
    const actionName = actionFile.name.toUpperCase();
    core.debug(`actionName = ${actionName}`);

    for (const taskInput of actionFile.inputs) {
        const inputValue = core.debug.getInput(`${taskInput.name}`);
        if (inputValue != null) {
            const varName = `MSCA_${actionName}_${taskInput.name.toUpperCase()}`;
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