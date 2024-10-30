# Project: RTTLogger - Simple RTT Logging and Dashboard with UDP/TCP

## Overview
**RTTLogger** is a client-server application designed to measure and log Round Trip Time (RTT) metrics with UDP. 
This project leverages AWS Lambda and API Gateway for REST API management, Amazon DynamoDB for data storage, 
and S3 for logs or backups. Using a small UDP component, this version allows users to measure network performance 
and log RTT without needing full server management.

### Backend (Server-Side)
- **Programming Language**: Node.js (for Lambda functions)
- **UDP Socket**: Python `socket` library or Node.js `dgram` for handling basic UDP communication
- **Database**: Amazon DynamoDB (serverless, scales automatically)
- **API Gateway**: AWS API Gateway (for REST API endpoints)
- **Data Storage**: Amazon S3 (for storing logs if needed)
- **API Testing**: Postman (to verify REST API functions)

### Frontend (Client-Side)
- **Programming Language**: JavaScript (HTML/CSS with basic JavaScript, or React)
- **UI Libraries**: Chart.js (for data visualization)
- **Deployment**: Amazon S3 (for hosting a static web page if needed)

### AWS Services
- **Compute**: AWS Lambda (serverless for REST functionality)
- **Database**: DynamoDB (for scalable data storage)
- **API Gateway**: AWS API Gateway (for REST API management)
- **Logging**: CloudWatch Logs (for real-time logs and monitoring)


## Project with UDP/TCP for RTT Measurement

### Phase 1: Initial Planning & Requirements
1. **Define Application Requirements**
   - **Functional**: Log RTT via UDP from clients, retrieve data, and display RTT history on a simple dashboard.
   - **Non-Functional**: Keep it serverless, low-maintenance, and simple for beginners.
2. **Define AWS Architecture**
   - Choose AWS services like Lambda and DynamoDB for low-maintenance backend.

### Phase 2: UDP-Based RTT Logging and Serverless REST API

1. **Simple UDP Server on Lambda**
   - Create a lightweight Lambda function for handling UDP packets.
   - Use Python's `socket` library or Node.js `dgram` to listen to UDP requests.
   - Set up a UDP endpoint (can use API Gateway with WebSocket setup) to receive and respond to client requests.
   - **Alternative**: For simplicity, implement a basic UDP listener on the client side that records the RTT and sends it to Lambda over HTTP.

2. **AWS Lambda and API Gateway Setup**
   - Create additional Lambda functions to:
     - Store RTT data in DynamoDB.
     - Retrieve stored RTT logs for display on the dashboard.

3. **Backend Development**
   - REST endpoints in Lambda using Python or Node.js:
     - Accept RTT logs from clients via HTTP.
     - Retrieve and return RTT logs from DynamoDB to the dashboard.
4. **UDP RTT Logging Mechanism**
   - Use a client UDP socket to send a small message to the server’s UDP Lambda endpoint.
   - Measure RTT by recording timestamps on both send and receive, log RTT data in DynamoDB.

### Phase 3: Client Application Development
1. **UDP Client-Server Communication**
   - Create a simple HTML/JavaScript client to:
     - Send UDP messages to the server endpoint to measure RTT.
     - Log RTT data in the browser for easy tracking and send it to Lambda.
2. **Data Display with REST**
   - Use Chart.js to display RTT logs, latency graphs, and historical data.
   - Fetch RTT logs from Lambda and DynamoDB to visualize RTT on the dashboard.

### Phase 4: Simple Dashboard Development
1. **Dashboard Design**
   - Design a basic HTML/CSS or React dashboard that displays RTT history, average RTT, and recent connections.
2. **Authentication**
   - Use simple authentication methods (e.g., API keys) with API Gateway to protect the dashboard.

### Phase 5: Testing and Monitoring
1. **Testing UDP and REST API**
   - Use Postman to validate each REST API endpoint.
   - Test the UDP connection using a client to ensure RTT logs are accurate.
2. **Monitoring with CloudWatch**
   - Enable CloudWatch for Lambda and API Gateway to track performance and logs.


### Phase 6: Deployment & Maintenance
1. **Final Deployment**
   - Deploy Lambda functions and API Gateway setup to production.
   - Use S3 for log backups and set up monitoring alerts in CloudWatch.
2. **Ongoing Maintenance**
   - Monitor Lambda and API Gateway health and make adjustments as needed.
