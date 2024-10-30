import unittest
import socket
import json
import time
from server.udp_server import RTTServer

class TestRTTServer(unittest.TestCase):
    def setUp(self):
        self.server = RTTServer(host='127.0.0.1', port=12345)
        self.client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def tearDown(self):
        self.server.cleanup()
        self.client_socket.close()

    def test_server_connection(self):
        message = {
            'client_ip': '127.0.0.1',
            'rtt': 100.0,
            'packet_loss_rate': 0.0,
            'timestamp': time.time()
        }
        
        # Send test message
        self.client_socket.sendto(
            json.dumps(message).encode(),
            ('127.0.0.1', 12345)
        )
        
        # Receive response
        data, addr = self.client_socket.recvfrom(1024)
        response = json.loads(data.decode())
        
        self.assertEqual(response['status'], 'success')

    def test_rate_limiting(self):
        message = {
            'client_ip': '127.0.0.1',
            'rtt': 100.0,
            'packet_loss_rate': 0.0,
            'timestamp': time.time()
        }
        
        # Send multiple requests quickly
        for _ in range(150):  # More than rate limit
            self.client_socket.sendto(
                json.dumps(message).encode(),
                ('127.0.0.1', 12345)
            )
        
        # Last request should be rate limited
        data, addr = self.client_socket.recvfrom(1024)
        response = json.loads(data.decode())
        
        self.assertEqual(response['status'], 'error')
        self.assertIn('rate limit', response['message'].lower())

if __name__ == '__main__':
    unittest.main() 