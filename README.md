# RTT Logger

A comprehensive real-time network monitoring tool that measures and analyzes Round Trip Time (RTT) using UDP/TCP protocols with AWS infrastructure integration.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Testing](#testing)
- [AWS Integration](#aws-integration)
- [Monitoring](#monitoring)

## Prerequisites

### Required Software
1. **Python 3.8+**
   ```bash
   # Check Python version
   python --version
   ```

2. **Node.js 14+**
   ```bash
   # Check Node.js version
   node --version
   npm --version
   ```

3. **Git**
   ```bash
   # Check Git version
   git --version
   ```

4. **SQLite3**
   ```bash
   # Check SQLite version
   sqlite3 --version
   ```

5. **AWS CLI**
   ```bash
   # Check AWS CLI version
   aws --version
   ```

### System Requirements
- RAM: 4GB minimum, 8GB recommended
- Storage: 1GB free space
- Network: Stable internet connection
- Ports: 12345 (UDP), 5000 (REST API), 8000 (Web Server)

## Installation

### 1. Clone Repository
```bash
# Clone the repository
git clone https://github.com/Jimmyu2foru18/rtt-logger.git
cd rtt-logger

# Check current branch
git status
```

### 2. Python Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Unix/MacOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

### 3. Node.js Setup
```bash
# Install Node.js packages
npm install

# Verify installation
npm list
```

### 4. Database Setup
```bash
# Initialize SQLite database
python scripts/init_db.py

# Verify database creation
sqlite3 rtt_data.db ".tables"
```

## Configuration

### 1. Environment Variables
Create `.env` file in project root:
```plaintext
# Server Configuration
UDP_SERVER_HOST=127.0.0.1
UDP_SERVER_PORT=12345
REST_API_PORT=5000

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Monitoring Configuration
LOG_LEVEL=INFO
ENABLE_X_RAY=true
ENABLE_CLOUDWATCH=true

# Security Configuration
RATE_LIMIT_PER_MINUTE=100
MAX_CONNECTIONS=1000
```

### 2. AWS Configuration
```bash
# Configure AWS CLI
aws configure

# Test AWS configuration
aws sts get-caller-identity
```

## Running the Application

### 1. Start UDP Server
```bash
# Terminal 1
python server/udp_server.py

# Expected output:
# Server started on 127.0.0.1:12345
```

### 2. Start REST API
```bash
# Terminal 2
python server/rest_api.py

# Expected output:
# * Running on http://127.0.0.1:5000/
```

### 3. Start Web Interface
```bash
# Terminal 3
python -m http.server 8000

# Expected output:
# Serving HTTP on 0.0.0.0 port 8000...
```

### 4. Access Application
1. Open web browser
2. Navigate to http://localhost:8000
3. Verify all components are connected:
   - UDP Server status: Connected
   - REST API status: Available
   - Database status: Connected

## Features

### 1. RTT Monitoring
- Real-time RTT measurements
- Packet loss detection
- Latency analysis
- Historical data tracking

### 2. Data Visualization
- Live RTT graphs
- Statistical analysis
- Performance metrics
- Custom date ranges

### 3. AWS Integration
- CloudWatch metrics
- X-Ray tracing
- DynamoDB storage
- Lambda functions

## Troubleshooting

### Common Issues

1. **UDP Server Won't Start**
   ```bash
   # Check port availability
   netstat -ano | findstr :12345
   
   # Check permissions
   whoami
   ```

2. **REST API Errors**
   ```bash
   # Check logs
   tail -f rest_api.log
   
   # Test API
   curl http://localhost:5000/api/health
   ```

3. **Database Issues**
   ```bash
   # Check database integrity
   sqlite3 rtt_data.db "PRAGMA integrity_check;"
   
   # Backup database
   sqlite3 rtt_data.db ".backup backup.db"
   ```

## Development

### Code Style
```bash
# Format Python code
black .

# Lint JavaScript
npm run lint

# Check types
mypy .
```

### Making Changes
1. Create new branch
   ```bash
   git checkout -b feature/new-feature
   ```

2. Make changes and test
   ```bash
   # Run tests
   pytest
   npm test
   ```

3. Submit PR
   ```bash
   git push origin feature/new-feature
   ```

## Testing

### Unit Tests
```bash
# Python tests
pytest tests/

# JavaScript tests
npm test
```

### Integration Tests
```bash
# End-to-end tests
npm run test:e2e

# Load tests
python tests/load_test.py
```

## AWS Integration

### 1. Deploy Infrastructure
```bash
# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file aws/cloudformation.yaml \
    --stack-name rtt-logger \
    --capabilities CAPABILITY_IAM
```

### 2. Configure Services
```bash
# Update Lambda functions
./scripts/deploy_lambda.sh

# Configure API Gateway
./scripts/configure_api.sh
```

## Monitoring

### Local Monitoring
```bash
# Check logs
tail -f rtt_server.log
tail -f rest_api.log

# Monitor database
sqlite3 rtt_data.db "SELECT COUNT(*) FROM rtt_logs;"
```

### AWS Monitoring
1. CloudWatch Metrics
2. X-Ray Traces
3. Performance Insights
4. Cost Analysis

## Support

Need help? Try these resources:
1. Check [documentation](docs/)
2. Review [common issues](#troubleshooting)
3. Open an [issue](https://github.com/Jimmyu2foru18/rtt-logger/issues)

---
Made by Jimmy
