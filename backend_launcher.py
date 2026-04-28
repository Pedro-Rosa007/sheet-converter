import os
from pathlib import Path

import uvicorn


def ensure_planilhas_root() -> Path:
    configured_root = os.environ.get('PLANILHAS_ROOT')
    if configured_root:
        root = Path(configured_root)
    else:
        root = Path(__file__).resolve().parent / 'planilhas'

    root.mkdir(parents=True, exist_ok=True)
    os.environ['PLANILHAS_ROOT'] = str(root)
    return root


ensure_planilhas_root()

from api.main import app


if __name__ == '__main__':
    uvicorn.run(
        app,
        host='127.0.0.1',
        port=8001,
        log_level='info'
    )