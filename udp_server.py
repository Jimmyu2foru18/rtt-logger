import socket
import time
import json
import sqlite3
import logging
from datetime import datetime
import threading
from dataclasses import dataclass
from typing import Dict, List, Optional
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize X-Ray
xray_recorder.configure(service='RTTLogger-UDP')
patch_all()

# Data validation class
@dataclass
class RTTData:
    client_ip: str
    rtt: float
    packet_loss_rate: float
    timestamp: float

class RTTServer:
    def __init__(self, host='127.0.0.1', port=12345):
        # Set up logging
        self.logger = logging.getLogger('RTTLogger')
        self.logger.setLevel(logging.INFO)
        handler = logging.FileHandler('rtt_server.log')
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(handler)

        # Rate limiting
        self.rate_limits: Dict[str, List[float]] = {}
        self.RATE_LIMIT_WINDOW = 60  # seconds
        self.MAX_REQUESTS = 100  # per window

        # Connection pool
        self.db_pool = sqlite3.connect(
            'rtt_data.db',
            check_same_thread=False,
            timeout=30
        )
        
        # Initialize server
        try:
            self.host = host
            self.port = port
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.sock.bind((self.host, self.port))
            self.running = True
            self.logger.info(f"Server started on {self.host}:{self.port}")
        except Exception as e:
            self.logger.error(f"Failed to initialize server: {e}")
            raise

    def check_rate_limit(self, client_addr: str) -> bool:
        current_time = time.time()
        if client_addr not in self.rate_limits:
            self.rate_limits[client_addr] = []
        
        # Clean old requests
        self.rate_limits[client_addr] = [
            t for t in self.rate_limits[client_addr]
            if current_time - t < self.RATE_LIMIT_WINDOW
        ]
        
        # Check limit
        if len(self.rate_limits[client_addr]) >= self.MAX_REQUESTS:
            return False
        
        self.rate_limits[client_addr].append(current_time)
        return True

    def validate_data(self, data: dict) -> Optional[RTTData]:
        try:
            return RTTData(
                client_ip=data['client_ip'],
                rtt=float(data['rtt']),
                packet_loss_rate=float(data['packet_loss_rate']),
                timestamp=float(data.get('timestamp', time.time()))
            )
        except (KeyError, ValueError) as e:
            self.logger.error(f"Data validation failed: {e}")
            return None

    @xray_recorder.capture('handle_client')
    def handle_client(self, data: bytes, addr: tuple):
        try:
            # Rate limiting
            if not self.check_rate_limit(addr[0]):
                self.logger.warning(f"Rate limit exceeded for {addr[0]}")
                return

            # Data validation
            message = json.loads(data.decode())
            validated_data = self.validate_data(message)
            if not validated_data:
                return

            # Process data
            response = self.process_data(validated_data)
            
            # Send response
            self.sock.sendto(json.dumps(response).encode(), addr)
            
        except Exception as e:
            self.logger.error(f"Error handling client {addr}: {e}")

    def process_data(self, data: RTTData) -> dict:
        try:
            with self.db_pool as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO rtt_logs (client_ip, rtt, packet_loss_rate, timestamp)
                    VALUES (?, ?, ?, ?)
                """, (data.client_ip, data.rtt, data.packet_loss_rate, data.timestamp))
                conn.commit()
            
            return {
                'status': 'success',
                'timestamp': time.time(),
                'message': 'Data processed successfully'
            }
        except Exception as e:
            self.logger.error(f"Error processing data: {e}")
            return {
                'status': 'error',
                'timestamp': time.time(),
                'message': str(e)
            }

    def cleanup(self):
        """Cleanup resources"""
        try:
            self.running = False
            self.sock.close()
            self.db_pool.close()
            self.logger.info("Server shutdown complete")
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()

if __name__ == "__main__":
    with RTTServer() as server:
        try:
            while server.running:
                data, addr = server.sock.recvfrom(1024)
                server.handle_client(data, addr)
        except KeyboardInterrupt:
            server.logger.info("Server stopped by user")