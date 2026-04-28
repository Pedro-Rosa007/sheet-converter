const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');


let mainWindow = null;
let pythonProcess = null;
const PYTHON_SCRIPT = path.join(__dirname, 'api', 'main.py');
const API_URL = 'http://127.0.0.1:8001';
const API_TIMEOUT = 30000; // 30 segundos

function isApiRunning() {
    return new Promise((resolve) => {
        try {
            require('http').get(API_URL + '/health', (res) => {
                resolve(res.statusCode === 200);
            }).on('error', () => {
                resolve(false);
            });
        } catch (error) {
            resolve(false);
        }
    });
}

async function waitForApi(maxAttempts = 6) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            if (await isApiRunning()) {
                console.log('✅ API está disponível');
                return true;
            }
        } catch (e) {
            // continua tentando
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        if (i < maxAttempts - 1) {
            console.log(`⏳ Aguardando API... (${Math.round((i + 1) * 0.5)}s)`);
        }
    }
    console.warn('⚠️ Timeout aguardando API - continuando mesmo assim');
    return false;
}

function getPythonExecutable() {
    const { execSync } = require('child_process');
    const candidates = [];

    if (process.env.SHEETS_PYTHON) {
        candidates.push(process.env.SHEETS_PYTHON);
    }

    if (process.env.PYTHON) {
        candidates.push(process.env.PYTHON);
    }

    const pythonNames = ['python3', 'python', 'python.exe'];
    for (const pythonName of pythonNames) {
        try {
            execSync(`${pythonName} --version`, { stdio: 'pipe' });
            return pythonName;
        } catch (e) {
        }
    }

    try {
        const wherePython = execSync('where python', { encoding: 'utf8' })
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
        candidates.push(...wherePython);
    } catch (e) {
    }

    try {
        const wherePython3 = execSync('where python3', { encoding: 'utf8' })
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
        candidates.push(...wherePython3);
    } catch (e) {
    }

    for (const candidate of candidates) {
        try {
            if (fs.existsSync(candidate)) {
                execSync(`"${candidate}" --version`, { stdio: 'pipe' });
                return candidate;
            }
        } catch (e) {
        }
    }

    return null;
}

function killPortProcess(port) {
    try {
        const { execSync } = require('child_process');
        const cmd = `netstat -ano | findstr :${port}`;
        const output = execSync(cmd, { encoding: 'utf8' });
        const lines = output.split('\n');
        const pids = new Set();
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5) {
                const pid = parts[4];
                if (!isNaN(pid)) pids.add(pid);
            }
        });
        pids.forEach(pid => {
            try { execSync(`taskkill /F /PID ${pid}`); } catch (e) { }
        });
    } catch (e) { }
}

function startPythonServer() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Iniciando servidor FastAPI...');
        
        killPortProcess(8001);
        
        const pythonExecutable = getPythonExecutable();
        if (!pythonExecutable) {
            reject(new Error('Python não encontrado. Instale o Python e as dependências do projeto.'));
            return;
        }

        let started = false;
        let stderrBuffer = '';
        
        const appDir = app.isPackaged
            ? path.join(process.resourcesPath, 'app.asar.unpacked')
            : __dirname;
        
        try {
            // Inicia Python a partir da raiz do projeto (sem --reload para performance)
            const appRoot = app.isPackaged ? path.dirname(process.execPath) : __dirname;

            pythonProcess = spawn(pythonExecutable, ['-m', 'uvicorn', 'api.main:app', '--host', '127.0.0.1', '--port', '8001'], {
                cwd: appDir,
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false,
                windowsHide: true,
                shell: false,
                env: {
                    ...process.env,
                    PYTHONPATH: appDir,
                    PLANILHAS_ROOT: appRoot
                }
            });

            pythonProcess.stdout?.on('data', (data) => {
                const output = data.toString().trim();
                if (output) console.log(`[Python] ${output}`);
            });

            pythonProcess.stderr?.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    stderrBuffer += output + '\n';
                    console.error(`[Python] ${output}`);
                }
            });

            pythonProcess.on('error', (error) => {
                console.error('❌ Erro ao iniciar Python:', error.message);
                reject(error);
            });

            pythonProcess.on('close', (code) => {
                console.log(`[Python] Processo encerrado com código ${code}`);
                pythonProcess = null;
                if (!started) {
                    const detail = stderrBuffer.trim() || `Servidor Python encerrou com código ${code}`;
                    reject(new Error(detail));
                }
            });

            // Aguardar a API ficar disponível (máx 3 segundos)
            setTimeout(async () => {
                if (await waitForApi()) {
                    console.log('✅ Servidor iniciado com sucesso');
                    started = true;
                    resolve();
                } else {
                    console.log('⚠️ API ainda iniciando, continuando mesmo assim...');
                    started = true;
                    resolve(); // Continuar mesmo se não responder
                }
            }, 500);

        } catch (error) {
            console.error('❌ Erro ao iniciar servidor:', error.message);
            reject(error);
        }
    });
}

function stopPythonServer() {
    return new Promise((resolve) => {
        if (pythonProcess) {
            console.log('🛑 Parando servidor FastAPI...');
            pythonProcess.kill('SIGTERM');
            
            // Força kill após 5 segundos se ainda estiver rodando
            setTimeout(() => {
                if (pythonProcess) {
                    pythonProcess.kill('SIGKILL');
                }
                resolve();
            }, 5000);
        } else {
            resolve();
        }
    });
}

function createWindow() {
    console.log('📱 Criando janela principal...');
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    // URL do arquivo HTML
    const startUrl = `file://${path.join(__dirname, 'public', 'html', 'index.html')}`;
    mainWindow.loadURL(startUrl);

    // Abrir DevTools em modo dev
    if (process.env.ELECTRON_DEV) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    console.log('✅ Janela criada');
}

app.on('ready', async () => {
    console.log('🎉 Electron pronto!');
    
    try {
        // Iniciar servidor Python
        await startPythonServer();
        
        // Criar janela
        createWindow();
        
        // Criar menu
        createMenu();
        
    } catch (error) {
        console.error('❌ Erro ao inicializar:', error);
        dialog.showErrorBox(
            'Erro ao Inicializar',
            'Falha ao iniciar o servidor. Verifique se Python está instalado.'
        );
        app.quit();
    }
});

app.on('window-all-closed', async () => {
    console.log('🪟 Todas as janelas foram fechadas');
    await stopPythonServer();
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', async () => {
    console.log('👋 Encerrando aplicação...');
    await stopPythonServer();
});

function createMenu() {
    const template = [
        {
            label: 'Arquivo',
            submenu: [
                {
                    label: 'Sair',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Editar',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' }
            ]
        },
        {
            label: 'Exibir',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Ajuda',
            submenu: [
                {
                    label: 'Sobre',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Sobre Sheets Converter',
                            message: 'Sheets Converter v1.0.0',
                            detail: 'Sistema de Conversão e Migração de Planilhas'
                        });
                    }
                },
                {
                    label: 'Documentação da API',
                    click: () => {
                        require('electron').shell.openExternal(API_URL + '/docs');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

ipcMain.handle('check-api-status', async () => {
    const isRunning = await isApiRunning();
    return {
        running: isRunning,
        url: API_URL
    };
});

ipcMain.handle('open-external-url', async (event, url) => {
    require('electron').shell.openExternal(url);
});

ipcMain.handle('show-message', async (event, options) => {
    return dialog.showMessageBox(mainWindow, options);
});

ipcMain.on('log', (event, message) => {
    console.log(`[Renderer] ${message}`);
});


console.log('📦 Sheets Converter Electron App');
console.log('📂 App Path:', app.getAppPath());
console.log('💾 User Data Path:', app.getPath('userData'));
