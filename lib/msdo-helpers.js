"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeToOutStream = exports.getEncodedContent = exports.encode = exports.Constants = exports.CommandType = exports.SourceType = exports.Inputs = void 0;
const os_1 = __importDefault(require("os"));
var Inputs;
(function (Inputs) {
    Inputs["CommandType"] = "command";
})(Inputs || (exports.Inputs = Inputs = {}));
var SourceType;
(function (SourceType) {
    SourceType["Main"] = "main";
    SourceType["Pre"] = "pre";
    SourceType["Post"] = "post";
})(SourceType || (exports.SourceType = SourceType = {}));
var CommandType;
(function (CommandType) {
    CommandType["All"] = "all";
    CommandType["PreJob"] = "pre-job";
    CommandType["PostJob"] = "post-job";
    CommandType["Run"] = "run";
})(CommandType || (exports.CommandType = CommandType = {}));
var Constants;
(function (Constants) {
    Constants["Unknown"] = "unknown";
    Constants["PreJobStartTime"] = "PREJOBSTARTTIME";
})(Constants || (exports.Constants = Constants = {}));
const encode = (str) => Buffer.from(str, 'binary').toString('base64');
exports.encode = encode;
function getEncodedContent(dockerVersion, dockerEvents, dockerImages) {
    let data = [];
    data.push("DockerVersion: " + dockerVersion);
    data.push("DockerEvents:");
    data.push(dockerEvents);
    data.push("DockerImages:");
    data.push(dockerImages);
    return (0, exports.encode)(data.join(os_1.default.EOL));
}
exports.getEncodedContent = getEncodedContent;
function writeToOutStream(data, outStream = process.stdout) {
    outStream.write(data.trim() + os_1.default.EOL);
}
exports.writeToOutStream = writeToOutStream;
