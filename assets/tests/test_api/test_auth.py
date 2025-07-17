# backend/tests/api/admin/test_auth.py

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def dummy_password():
    return "admin1234"  # 테스트용 초기 비밀번호

def test_login_success(dummy_password):
    response = client.post("/admin/login", json={"password": dummy_password})
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["success"] is True

def test_login_fail():
    response = client.post("/admin/login", json={"password": "wrongpass"})
    assert response.status_code == 401
    assert response.json()["detail"] == "비밀번호가 일치하지 않습니다"

def test_logout_success(dummy_password):
    # 먼저 로그인하여 세션 획득
    login_res = client.post("/admin/login", json={"password": dummy_password})
    session_id = login_res.cookies.get("session_id")
    assert session_id

    headers = {"Cookie": f"session_id={session_id}"}
    response = client.post("/admin/logout", headers=headers, json={"session_id": session_id})
    assert response.status_code == 200
    assert response.json()["message"] == "로그아웃되었습니다"

def test_change_password(dummy_password):
    # 먼저 로그인
    login_res = client.post("/admin/login", json={"password": dummy_password})
    session_id = login_res.cookies.get("session_id")
    assert session_id

    headers = {"Cookie": f"session_id={session_id}"}
    response = client.post(
        "/admin/change-password",
        json={
            "current_password": dummy_password,
            "new_password": "newadmin1234"
        },
        headers=headers
    )
    assert response.status_code == 200
    asser
