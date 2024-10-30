import pytest
from rest_api import app
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_get_rtt_logs(client):
    response = client.get('/api/rtt/logs')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'status' in data
    assert data['status'] == 'success'

def test_rate_limiting(client):
    # Make multiple requests to trigger rate limit
    for _ in range(101):
        response = client.get('/api/rtt/logs')
    assert response.status_code == 429 