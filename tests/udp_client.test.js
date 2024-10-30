import { RTTClient } from '../udp_client.js';
import { jest } from '@jest/globals';

describe('RTTClient', () => {
    let client;
    
    beforeEach(() => {
        client = new RTTClient();
        // Mock WebSocket
        global.WebSocket = jest.fn().mockImplementation(() => ({
            send: jest.fn(),
            close: jest.fn(),
            addEventListener: jest.fn()
        }));
    });

    test('initializes with correct default values', () => {
        expect(client.isRunning).toBeFalsy();
        expect(client.rttHistory).toEqual([]);
        expect(client.packetSequence).toBe(0);
    });

    test('handles connection errors appropriately', () => {
        client.handleDisconnection();
        expect(client.connectionStatusElement.textContent).toBe('Disconnected');
    });

    // Add more tests...
}); 