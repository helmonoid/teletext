import os
import pytest


@pytest.fixture(autouse=True)
def tmp_data_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("TELETEXT_DATA_DIR", str(tmp_path))
    import app.config as config
    monkeypatch.setattr(config, "DATA_DIR", str(tmp_path))
    return tmp_path


@pytest.fixture
def client(tmp_data_dir):
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)
