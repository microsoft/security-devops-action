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
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const msca_installer_1 = require("./msca-installer");
const mscaVariables = __importStar(require("./msca-variables"));
class MscaAction {
    constructor() {
        this.integrationCliVersion = '1.*';
    }
    setupEnvironment(actionDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            // Setup Integration Variables
            mscaVariables.setup(actionDirectory);
            console.log('------------------------------------------------------------------------------');
            if (!process.env.MSCAI_DIRECTORY && !process.env.MSCAI_FILEPATH) {
                let integrationCliVersion = this.resolveIntegrationCliVersion();
                let mscaInstaller = new msca_installer_1.MscaInstaller();
                yield mscaInstaller.install(integrationCliVersion);
            }
            console.log('------------------------------------------------------------------------------');
        });
    }
    resolveIntegrationCliVersion() {
        let integrationCliVersion = this.integrationCliVersion;
        if (process.env.MSCAI_VERSION) {
            integrationCliVersion = process.env.MSCAI_VERSION;
        }
        return integrationCliVersion;
    }
    analyze() {
        return __awaiter(this, void 0, void 0, function* () {
            this.command('analyze');
        });
    }
    break() {
        return __awaiter(this, void 0, void 0, function* () {
            this.command('break');
        });
    }
    export() {
        return __awaiter(this, void 0, void 0, function* () {
            this.command('export');
        });
    }
    publish() {
        return __awaiter(this, void 0, void 0, function* () {
            this.command('publish');
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.command('run');
        });
    }
    command(actionCommand, failTask = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const actionDirectory = path.resolve(__dirname);
            core.debug(`dirname = ${__dirname}`);
            yield this.setupEnvironment(actionDirectory);
            let integrationCliFilePath = process.env.MSCAI_FILEPATH;
            core.debug(`integrationCliFilePath = ${integrationCliFilePath}`);
            let args = [actionCommand];
            if (failTask) {
                args.push('--logger-actions');
            }
            if (core.isDebug()) {
                args.push('--logger-level');
                args.push('trace');
            }
            core.debug('Running Microsoft Security Code Analysis...');
            try {
                yield exec.exec(integrationCliFilePath, args);
            }
            catch (error) {
                core.setFailed(error.Message);
            }
        });
    }
}
exports.MscaAction = MscaAction;
