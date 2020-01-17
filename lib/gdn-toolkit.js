"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const process = __importStar(require("process"));
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
class GuardianAction {
    constructor(core, exec) {
        this.core = core;
        this.exec = exec;
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
    analyze() {
        return __awaiter(this, void 0, void 0, function* () {
            const analyzeCommand = 'analyze';
            this.run(analyzeCommand);
        });
    }
    break() {
        return __awaiter(this, void 0, void 0, function* () {
            const breakCommand = 'break';
            this.run(breakCommand);
        });
    }
    export() {
        return __awaiter(this, void 0, void 0, function* () {
            const reportCommand = 'export';
            this.run(reportCommand);
        });
    }
    publish() {
        return __awaiter(this, void 0, void 0, function* () {
            const publishCommand = 'publish';
            this.run(publishCommand);
        });
    }
    run(actionCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            const gdnActionFolder = path.resolve(__dirname);
            this.core.debug(`dirname = ${__dirname}`);
            // this.setupEnvironment(actionDirectory);
            try {
                console.log("Hello, Guardian Action!");
                // await this.exec.exec('<toolPath>', '<arguments>')
            }
            catch (error) {
                this.core.setFailed(error.Message);
            }
        });
    }
}
exports.GuardianAction = GuardianAction;
