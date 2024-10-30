class APIClient {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
    }

    async getRTTLogs(params = {}) {
        try {
            const queryParams = new URLSearchParams(params);
            const response = await fetch(`${this.baseURL}/rtt/logs?${queryParams}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch RTT logs:', error);
            throw error;
        }
    }

    async getRTTStats() {
        try {
            const response = await fetch(`${this.baseURL}/rtt/stats`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch RTT stats:', error);
            throw error;
        }
    }

    async logRTTData(data) {
        try {
            const response = await fetch(`${this.baseURL}/rtt/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to log RTT data:', error);
            throw error;
        }
    }
}

// Usage in UDP client
class RTTClient {
    constructor() {
        // ... existing initialization ...
        this.apiClient = new APIClient();
    }

    async handleResponse(response) {
        const rtt = Date.now() - response.received_time;
        
        // Log RTT data via REST API
        await this.apiClient.logRTTData({
            client_ip: window.location.hostname,
            rtt: rtt,
            packet_loss_rate: response.packet_loss_rate,
            min_rtt: this.statistics.minRTT,
            max_rtt: this.statistics.maxRTT,
            mean_rtt: this.statistics.meanRTT,
            median_rtt: this.statistics.medianRTT,
            std_dev: this.statistics.stdDev,
            jitter: this.statistics.jitter
        });

        // Update UI
        this.updateStats(rtt, response.packet_loss_rate);
    }
} 