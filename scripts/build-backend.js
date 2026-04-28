const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const pythonExecutable = path.join(projectRoot, '.venv', 'Scripts', 'python.exe');
const launcherFile = path.join(projectRoot, 'backend_launcher.py');
const requirementsFile = path.join(projectRoot, 'api', 'requirements.txt');
const distDir = path.join(projectRoot, 'api', 'dist');
const buildDir = path.join(projectRoot, 'api', 'build');
const specDir = path.join(buildDir, 'spec');

fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(specDir, { recursive: true });

if (!fs.existsSync(pythonExecutable)) {
    console.error(`Python da venv não encontrado em ${pythonExecutable}`);
    process.exit(1);
}

if (!fs.existsSync(requirementsFile)) {
    console.error(`Arquivo de dependências não encontrado em ${requirementsFile}`);
    process.exit(1);
}

const installRequirements = spawnSync(pythonExecutable, ['-m', 'pip', 'install', '-r', requirementsFile], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false
});

if (installRequirements.status !== 0) {
    process.exit(installRequirements.status || 1);
}

const pyinstallerArgs = [
    '-m',
    'PyInstaller',
    '--noconfirm',
    '--clean',
    '--onefile',
    '--name',
    'sheets-fastapi',
    '--distpath',
    distDir,
    '--workpath',
    buildDir,
    '--specpath',
    specDir,
    '--collect-all',
    'pandas',
    '--collect-all',
    'openpyxl',
    launcherFile
]

const result = spawnSync(pythonExecutable, pyinstallerArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false
});

if (result.status !== 0) {
    process.exit(result.status || 1);
}