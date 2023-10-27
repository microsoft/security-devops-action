const { execSync } = require('child_process');
const fs = require('fs');
const gulp = require('gulp');
const path = require('path');
const process = require('process');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json');
const testTsProject = ts.createProject(path.join(__dirname, 'test', 'tsconfig.json'));

function clean(cb) {
    import('del')
        .then((del) => del.deleteSync(['lib']))
        .then(() => cb());
}

function sideload(cb) {
    if (process.env.SECURITY_DEVOPS_ACTION_BUILD_SIDELOAD === 'true') {
        console.log('Sideload mode enabled. Linking @microsoft/security-devops-actions-toolkit');

        const toolkitSrcDir = path.resolve(path.join(__dirname, '..', 'security-devops-actions-toolkit'));

        if (!fs.existsSync(toolkitSrcDir)) {
            throw new Error(`Could not the toolkit repo directory: ${toolkitSrcDir}. Please clone the repo to a parallel directory to this extension repo. Repo homepage: https://github.com/microsoft/security-devops-actions-toolkit`);
        }

        const toolkitNodeModulesDir = path.join(__dirname, 'node_modules', '@microsoft', 'security-devops-actions-toolkit');

        if (!fs.existsSync(toolkitNodeModulesDir)) {
            throw new Error(`The node_modules directory for the toolkit does not exist. please run npm install before continuing: ${toolkitNodeModulesDir}`);
        }

        if (process.env.SECURITY_DEVOPS_ACTION_BUILD_SIDELOAD_BUILD !== 'false') {
            console.log('Building sideload project: npm run build');
            const output = execSync('npm run build', { cwd: toolkitSrcDir, encoding: 'utf8' });
            console.log(output);
        }

        console.log(`Clearing the existing toolkit directory: ${toolkitNodeModulesDir}`);
        clearDir(toolkitNodeModulesDir);

        const toolkitDistDir = path.join(toolkitSrcDir, 'dist');

        console.log("Copying sideload build...");
        copyFiles(toolkitDistDir, toolkitNodeModulesDir);

        fs.writeFileSync(
            path.join(toolkitNodeModulesDir, '.sideloaded'),
            'This package was built and sideloaded by the security-devops-action build process. Do not commit this file to source control.');
    }
    cb();
}

function compile(cb) {
    tsProject
        .src()
        .pipe(tsProject()).js
        .pipe(gulp.dest('lib'))
        .on('end', () => cb());
}

function compileTests(cb) {
    testTsProject
        .src()
        .pipe(testTsProject()).js
        .pipe(gulp.dest(path.join(__dirname, 'test')))
        .on('end', () => cb());
}

function clearDir(dirPath) {
    // Get a list of files and subdirectories in the directory
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const itemPath = path.join(dirPath, item);

        if (fs.statSync(itemPath).isFile()) {
            fs.unlinkSync(itemPath);
        } else {
            clearDir(itemPath);
        }
    }

    // Finally, remove the empty directory
    fs.rmdirSync(dirPath);
}

function copyFiles(srcDir, destDir) {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
  
    fs.readdirSync(srcDir).forEach((file) => {
        const srcFilePath = path.join(srcDir, file);
        const destFilePath = path.join(destDir, file);
    
        if (fs.statSync(srcFilePath).isDirectory()) {
            copyFiles(srcFilePath, destFilePath);
        } else {
            fs.copyFileSync(srcFilePath, destFilePath);
            console.log(`Copied ${srcFilePath} to ${destFilePath}`);
        }
    });
  }

exports.clean = clean;
exports.compile = compile;
exports.compileTests = compileTests;
exports.build = gulp.series(clean, sideload, compile);
exports.buildTests = gulp.series(exports.build, compileTests);
exports.default = exports.build;