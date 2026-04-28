# Sheets Converter Electron App

Sistema de Conversão e Migração de Planilhas em Electron

## 🚀 Instalação

### Pré-requisitos
- Node.js 14+ (para development)
- Python 3.7+ (para o servidor FastAPI)
- pip (gerenciador de pacotes Python)

### Dependências Python
```bash
cd api
pip install -r requirements.txt
```

Crie um arquivo `requirements.txt` na pasta `api/` com:
```
fastapi==0.104.1
uvicorn==0.24.0
pandas==2.1.1
openpyxl==3.10.10
python-multipart==0.0.6
```

### Dependências Node
```bash
npm install
```

## 🛠️ Desenvolvimento

### Rodar em modo desenvolvimento
```bash
npm run dev
```

Isso vai:
1. Iniciar o servidor FastAPI automaticamente
2. Abrir a janela do Electron
3. Ativar DevTools para debugging

## 📦 Build/Distribuição

### Windows - Build executável
```bash
npm run build:win
```

Isso vai gerar:
- `Sheets Converter-1.0.0.exe` - Instalador NSIS
- `Sheets Converter-1.0.0.exe` - Portável (na pasta dist)

### Build para todos os SOs
```bash
npm run build:all
```

## 📁 Estrutura do Projeto

```
sheets-converter-main/
├── main.js              # Processo principal Electron
├── preload.js           # Script de preload (segurança)
├── package.json         # Configuração Node/Electron
├── api/
│   ├── main.py          # Servidor FastAPI
│   └── services/
│       └── services.py
├── public/
│   ├── html/
│   │   └── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── script.js
├── console/
├── planilhas/           # Pasta para arquivos da migração
└── assets/              # Ícones etc (opcional)
```

## 🔧 Como Funciona

### Ao iniciar o app:
1. **Electron carrega** o `main.js`
2. **Python é iniciado** automaticamente (servidor FastAPI)
3. **Aguarda** até 30 segundos pela API ficar disponível
4. **Abre** a janela com o frontend
5. **Frontend** se conecta à API em `http://127.0.0.1:8001`

### Ao fechar o app:
1. **Janela fecha**
2. **Servidor Python é parado** graciosamente
3. **Aplicação encerra**

## 💻 Comandos

| Comando | Descrição |
|---------|-----------|
| `npm start` | Rodar em produção |
| `npm run dev` | Desenvolvimento com DevTools |
| `npm run build:win` | Build para Windows |
| `npm run build` | Build com dialog de opções |
| `npm run pack` | Apenas empacotar (sem instalador) |

## 🐛 Troubleshooting

### "Python não encontrado"
- Certifique-se de que Python está no PATH
- Ou especifique o caminho em `main.js`

### "Porta 8001 já em uso"
- Outra instância da aplicação está rodando
- Ou outra aplicação usa essa porta
- Mude a porta em `api/main.py` e `preload.js`

### "Arquivo .xlsx não encontrado"
- Verifique se o arquivo está na pasta `planilhas/`
- Use o caminho absoluto correto

## 📝 Notas

- O executável vai sempre iniciar o FastAPI
- Recomendado instalar com "Criar atalho na área de trabalho"
- A aplicação roda localmente, sem conexão com internet

## 📄 Licença

MIT

## 👨‍💻 Autor

Seu Nome

---

**Versão**: 1.0.0  
**Última atualização**: 27/04/2026
