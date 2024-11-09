class RTTClient {
    constructor() {
        this.isRunning = false;
        this.rttHistory = [];
        this.packetSequence = 0;
        this.packetsLost = 0;
        this.totalPackets = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;

        this.initDatabase();

        this.initUI();

        this.statistics = {
            minRTT: Infinity,
            maxRTT: 0,
            meanRTT: 0,
            medianRTT: 0,
            stdDev: 0,
            percentile95: 0,
            percentile99: 0,
            jitter: 0,
            windowSize: 100  
        };
        
        this.updateDebounceTimer = null;
        this.UPDATE_DEBOUNCE_TIME = 100;

        this.dataBuffer = [];
        this.BUFFER_SIZE = 10;

        this.statsWorker = new Worker('js/stats-worker.js');

        this.retryConfig = {
            maxAttempts: 3,
            backoffMs: 1000
        };

        this.errorBoundary = {
            maxErrors: 5,
            resetInterval: 60000
        };
    }
    
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

        this.rttHistory.push(rtt);
        this.updateStats(rtt, packetLoss);
        this.chart.addRTTData(rtt);

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

        const sorted = [...window].sort((a, b) => a - b);

        this.statistics.minRTT = Math.min(...window);
        this.statistics.maxRTT = Math.max(...window);
        this.statistics.meanRTT = window.reduce((a, b) => a + b) / window.length;

        const mid = Math.floor(sorted.length / 2);
        this.statistics.medianRTT = sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];

        const variance = window.reduce((acc, val) => 
            acc + Math.pow(val - this.statistics.meanRTT, 2), 0) / window.length;
        this.statistics.stdDev = Math.sqrt(variance);

        const idx95 = Math.ceil(window.length * 0.95) - 1;
        const idx99 = Math.ceil(window.length * 0.99) - 1;
        this.statistics.percentile95 = sorted[idx95];
        this.statistics.percentile99 = sorted[idx99];

        const differences = window.slice(1).map((val, idx) => 
            Math.abs(val - window[idx]));
        this.statistics.jitter = differences.reduce((a, b) => a + b, 0) / differences.length;
    }

    updateStats(currentRTT, packetLoss) {
        this.rttHistory.push(currentRTT);
        if (this.rttHistory.length > this.statistics.windowSize) {
            this.rttHistory.shift();
        }
        
        this.calculateStatistics();
        
        this.currentRTTElement.textContent = `${currentRTT.toFixed(2)} ms`;
        this.averageRTTElement.textContent = `${this.statistics.meanRTT.toFixed(2)} ms`;
        this.packetLossElement.textContent = `${(packetLoss * 100).toFixed(2)}%`;

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

    debouncedUpdate(data) {
        clearTimeout(this.updateDebounceTimer);
        this.updateDebounceTimer = setTimeout(() => {
            this.updateStats(data);
        }, this.UPDATE_DEBOUNCE_TIME);
    }

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

document.addEventListener('DOMContentLoaded', () => {
    const client = new RTTClient();
}); 
