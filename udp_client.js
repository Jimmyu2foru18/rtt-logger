class RTTClient {
    constructor() {
        this.isRunning = false;
        this.rttHistory = [];
        this.packetSequence = 0;
        this.packetsLost = 0;
        this.totalPackets = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second delay
        
        // Initialize IndexedDB for local data persistence
        this.initDatabase();
        
        // Initialize UI elements
        this.initUI();
        
        // Add new statistical tracking
        this.statistics = {
            minRTT: Infinity,
            maxRTT: 0,
            meanRTT: 0,
            medianRTT: 0,
            stdDev: 0,
            percentile95: 0,
            percentile99: 0,
            jitter: 0,
            windowSize: 100  // Rolling window size for statistics
        };

        /* AWS Configuration
        this.awsConfig = {
            region: 'YOUR_REGION',
            userPoolId: 'YOUR_USER_POOL_ID',
            clientId: 'YOUR_CLIENT_ID',
            identityPoolId: 'YOUR_IDENTITY_POOL_ID'
        };

        // AWS Cognito Authentication
        this.auth = new AWS.CognitoIdentityServiceProvider();
        */

        // Add request debouncing
        this.updateDebounceTimer = null;
        this.UPDATE_DEBOUNCE_TIME = 100;
        
        // Add data buffering
        this.dataBuffer = [];
        this.BUFFER_SIZE = 10;
        
        // Add WebWorker for statistical calculations
        this.statsWorker = new Worker('js/stats-worker.js');

        // Add retry mechanism
        this.retryConfig = {
            maxAttempts: 3,
            backoffMs: 1000
        };
        
        // Add proper error boundaries
        this.errorBoundary = {
            maxErrors: 5,
            resetInterval: 60000
        };
    }

    /* AWS Authentication Methods
    async authenticateUser(username, password) {
        try {
            const authData = {
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: this.awsConfig.clientId,
                AuthParameters: {
                    USERNAME: username,
                    PASSWORD: password
                }
            };
            
            const response = await this.auth.initiateAuth(authData).promise();
            this.token = response.AuthenticationResult.AccessToken;
            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    async refreshToken() {
        // Token refresh logic
    }
    */

    /* AWS S3 Integration
    async uploadToS3(data) {
        try {
            const s3 = new AWS.S3();
            const params = {
                Bucket: 'rtt-logger-data',
                Key: `logs/${Date.now()}.json`,
                Body: JSON.stringify(data),
                ContentType: 'application/json'
            };
            await s3.putObject(params).promise();
        } catch (error) {
            console.error('Failed to upload to S3:', error);
        }
    }
    */

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('RTTLogger', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('rtt_measurements')) {
                    db.createObjectStore('rtt_measurements', { keyPath: 'timestamp' });
                }
            };
        });
    }

    initUI() {
        this.currentRTTElement = document.getElementById('currentRTT');
        this.averageRTTElement = document.getElementById('averageRTT');
        this.packetLossElement = document.getElementById('packetLoss');
        this.connectionStatusElement = document.getElementById('connectionStatus');
        
        document.getElementById('startTest').addEventListener('click', () => this.startTest());
        document.getElementById('stopTest').addEventListener('click', () => this.stopTest());
    }

    async startTest() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.reconnectAttempts = 0;
        this.connect();
    }

    async connect() {
        try {
            // Create UDP socket using WebRTC data channel as a workaround for web browsers
            const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
            this.peerConnection = new RTCPeerConnection(configuration);
            this.dataChannel = this.peerConnection.createDataChannel('udp-channel', {
                ordered: false,
                maxRetransmits: 0
            });

            this.dataChannel.onopen = () => {
                console.log('Connection established');
                this.connectionStatusElement.textContent = 'Connected';
                this.startRTTMeasurement();
            };

            this.dataChannel.onclose = () => {
                console.log('Connection closed');
                this.handleDisconnection();
            };

            this.dataChannel.onmessage = (event) => {
                this.handleResponse(JSON.parse(event.data));
            };

            // Handle connection errors
            this.peerConnection.onerror = (error) => {
                console.error('Connection error:', error);
                this.handleDisconnection();
            };

        } catch (error) {
            console.error('Failed to create connection:', error);
            this.handleDisconnection();
        }
    }

    handleDisconnection() {
        this.connectionStatusElement.textContent = 'Disconnected';
        
        if (this.isRunning && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.connectionStatusElement.textContent = `Reconnecting (Attempt ${this.reconnectAttempts})...`;
            
            // Exponential backoff for reconnection
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.connectionStatusElement.textContent = 'Failed to reconnect';
            this.stopTest();
        }
    }

    startRTTMeasurement() {
        this.measurementInterval = setInterval(() => {
            if (this.dataChannel && this.dataChannel.readyState === 'open') {
                const packet = {
                    sequence: this.packetSequence++,
                    send_time: Date.now(),
                    type: 'RTT_MEASURE'
                };
                
                this.dataChannel.send(JSON.stringify(packet));
                this.totalPackets++;
            }
        }, 1000);
    }

    async handleResponse(response) {
        const rtt = Date.now() - response.received_time;
        const packetLoss = response.packet_loss_rate;
        
        // Update statistics
        this.rttHistory.push(rtt);
        this.updateStats(rtt, packetLoss);
        this.chart.addRTTData(rtt);
        
        // Store measurement in IndexedDB
        await this.storeMeasurement({
            timestamp: Date.now(),
            rtt: rtt,
            packetLoss: packetLoss,
            sequence: response.sequence
        });
    }

    async storeMeasurement(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rtt_measurements'], 'readwrite');
            const store = transaction.objectStore('rtt_measurements');
            const request = store.add(data);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    calculateStatistics() {
        const window = this.rttHistory.slice(-this.statistics.windowSize);
        if (window.length === 0) return;

        // Sort window for percentile calculations
        const sorted = [...window].sort((a, b) => a - b);
        
        // Calculate basic statistics
        this.statistics.minRTT = Math.min(...window);
        this.statistics.maxRTT = Math.max(...window);
        this.statistics.meanRTT = window.reduce((a, b) => a + b) / window.length;
        
        // Calculate median
        const mid = Math.floor(sorted.length / 2);
        this.statistics.medianRTT = sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
        
        // Calculate standard deviation
        const variance = window.reduce((acc, val) => 
            acc + Math.pow(val - this.statistics.meanRTT, 2), 0) / window.length;
        this.statistics.stdDev = Math.sqrt(variance);
        
        // Calculate percentiles
        const idx95 = Math.ceil(window.length * 0.95) - 1;
        const idx99 = Math.ceil(window.length * 0.99) - 1;
        this.statistics.percentile95 = sorted[idx95];
        this.statistics.percentile99 = sorted[idx99];
        
        // Calculate jitter (variation in RTT)
        const differences = window.slice(1).map((val, idx) => 
            Math.abs(val - window[idx]));
        this.statistics.jitter = differences.reduce((a, b) => a + b, 0) / differences.length;
    }

    updateStats(currentRTT, packetLoss) {
        // Update RTT history and calculate statistics
        this.rttHistory.push(currentRTT);
        if (this.rttHistory.length > this.statistics.windowSize) {
            this.rttHistory.shift();
        }
        
        this.calculateStatistics();
        
        // Update UI elements
        this.currentRTTElement.textContent = `${currentRTT.toFixed(2)} ms`;
        this.averageRTTElement.textContent = `${this.statistics.meanRTT.toFixed(2)} ms`;
        this.packetLossElement.textContent = `${(packetLoss * 100).toFixed(2)}%`;
        
        // Update additional statistics in UI
        document.getElementById('minRTT').textContent = `${this.statistics.minRTT.toFixed(2)} ms`;
        document.getElementById('maxRTT').textContent = `${this.statistics.maxRTT.toFixed(2)} ms`;
        document.getElementById('medianRTT').textContent = `${this.statistics.medianRTT.toFixed(2)} ms`;
        document.getElementById('stdDev').textContent = `${this.statistics.stdDev.toFixed(2)} ms`;
        document.getElementById('jitter').textContent = `${this.statistics.jitter.toFixed(2)} ms`;
        document.getElementById('percentile95').textContent = `${this.statistics.percentile95.toFixed(2)} ms`;
        document.getElementById('percentile99').textContent = `${this.statistics.percentile99.toFixed(2)} ms`;
    }

    stopTest() {
        this.isRunning = false;
        if (this.measurementInterval) {
            clearInterval(this.measurementInterval);
        }
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.connectionStatusElement.textContent = 'Stopped';
    }

    // Debounced update method
    debouncedUpdate(data) {
        clearTimeout(this.updateDebounceTimer);
        this.updateDebounceTimer = setTimeout(() => {
            this.updateStats(data);
        }, this.UPDATE_DEBOUNCE_TIME);
    }

    // Batch processing of RTT data
    processDataBuffer() {
        if (this.dataBuffer.length >= this.BUFFER_SIZE) {
            this.statsWorker.postMessage({
                type: 'calculate',
                data: this.dataBuffer
            });
            this.dataBuffer = [];
        }
    }
}

// Initialize the client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const client = new RTTClient();
}); 