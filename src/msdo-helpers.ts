import os from 'os';
import { Writable } from "stream";

/**
 * Enum for the possible inputs for the task (specified in action.yml)
 */
export enum Inputs {
    Command = 'command',
    Config = 'config',
    Policy = 'policy',
    Categories = 'categories',
    Languages = 'languages',
    Tools = 'tools',
    IncludeTools = 'includeTools'
}

/**
 * Enum for the runner of the action.
 */
export enum RunnerType {
    Main = 'main',
    Pre = 'pre',
    Post = 'post'
}

/*
* Enum for the possible values for the Inputs.CommandType (specified in action.yml)
*/
export enum CommandType {
    All = 'all',
    PreJob = 'pre-job',
    PostJob = 'post-job',
    Run = 'run'
}

/*
* Enum for the possible values for the Inputs.Tools (specified in action.yml)
*/
export enum Tools {
    Bandit = 'bandit',
    Binskim = 'binskim',
    ContainerMapping = 'container-mapping',
    ESLint = 'eslint',
    TemplateAnalyzer = 'templateanalyzer',
    Terrascan = 'terrascan',
    Trivy = 'trivy'
}

/**
 * Enum for defining constants used in the task.
 */
export enum Constants {
    Unknown = "unknown",
    PreJobStartTime = "PREJOBSTARTTIME"
}

/**
 * Encodes a string to base64.
 * 
 * @param str - The string to encode.
 * @returns The base64 encoded string.
 */
export const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');

/**
 * Returns the encoded content of the Docker version, Docker events, and Docker images in the pre-defined format -
 * DockerVersion
 * Version: TaskVersion
 * <Delim>Events:
 * DockerEvents
 * <Delim>Images:
 * DockerImages
 * 
 * @param dockerVersion - The version of Docker.
 * @param dockerEvents - The Docker events.
 * @param dockerImages - The Docker images.
 * @param taskVersion - Optional version of the task. Defaults to the version in the action.yml file.
 * @param sectionDelim - Optional delimiter to separate sections in the encoded content. Defaults to ":::".
 * @returns The encoded content of the Docker version, Docker events, and Docker images.
 */
export function getEncodedContent(
    dockerVersion: string,
    dockerEvents: string,
    dockerImages: string
): string {
    let data : string[] = [];
    data.push("DockerVersion: " + dockerVersion);
    data.push("DockerEvents:");
    data.push(dockerEvents);
    data.push("DockerImages:");
    data.push(dockerImages);
    return encode(data.join(os.EOL));
}

/**
 * Writes the specified data to the specified output stream, followed by the platform-specific end-of-line character.
 * If no output stream is specified, the data is written to the standard output stream.
 * 
 * @param data - The data to write to the output stream.
 * @param outStream - Optional. The output stream to write the data to. Defaults to the standard output stream.
 */
export function writeToOutStream(data: string, outStream: Writable = process.stdout): void {
    outStream.write(data.trim() + os.EOL);
}