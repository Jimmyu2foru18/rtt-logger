class RTTChart {
    constructor() {
        this.ctx = document.getElementById('rttChart').getContext('2d');
        this.rttData = {
            labels: [],
            datasets: [{
                label: 'RTT (ms)',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        };
        
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: this.rttData,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.MAX_DATA_POINTS = 1000;
        this.decimationFactor = 1;
        
        this.chart.options.animation = false;
        this.chart.options.responsiveAnimationDuration = 0;
        
        this.updateBuffer = [];
        this.BUFFER_SIZE = 10;
    }

    addRTTData(rtt) {
        this.updateBuffer.push(rtt);
        
        if (this.updateBuffer.length >= this.BUFFER_SIZE) {
            this.batchUpdate();
        }
    }

    batchUpdate() {
        const updates = this.updateBuffer;
        this.updateBuffer = [];
        
        if (this.rttData.labels.length > this.MAX_DATA_POINTS) {
            this.decimateData();
        }
        
        updates.forEach(rtt => {
            this.rttData.labels.push(new Date().toLocaleTimeString());
            this.rttData.datasets[0].data.push(rtt);
        });
        
        this.chart.update('quiet');
    }

    decimateData() {
        this.decimationFactor *= 2;
        this.rttData.labels = this.rttData.labels.filter((_, i) => i % this.decimationFactor === 0);
        this.rttData.datasets[0].data = this.rttData.datasets[0].data.filter((_, i) => i % this.decimationFactor === 0);
    }
} 