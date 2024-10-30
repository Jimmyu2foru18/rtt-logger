const { chromium } = require('@playwright/test');

describe('End-to-End Tests', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await chromium.launch();
        page = await browser.newPage();
        await page.goto('http://localhost:3000');
    });

    test('complete user flow', async () => {
        // Start RTT test
        await page.click('#startTest');
        await page.waitForSelector('#connectionStatus');
        
        // Check connection status
        const status = await page.$eval('#connectionStatus', el => el.textContent);
        expect(status).toBe('Connected');

        // Wait for data collection
        await page.waitForTimeout(5000);

        // Check if chart is populated
        const chartData = await page.$eval('#rttChart', el => el.__chartInstance.data);
        expect(chartData.datasets[0].data.length).toBeGreaterThan(0);
    });
}); 