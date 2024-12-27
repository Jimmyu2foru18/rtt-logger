import java.net.*;
import java.util.ArrayList;
import java.util.List;

public abstract class Client {
    protected static final String SERVER_ADDRESS = "localhost";
    protected static final int SERVER_PORT = 5000;
    protected static final int MAX_ATTEMPTS = 3;
    
    protected final DatagramSocket socket;
    protected final Logger logger;
    protected final String clientId;
    protected final List<Long> rtts = new ArrayList<>();
    protected int successfulPackets = 0;

    public Client(String clientId) throws SocketException {
        this.clientId = clientId;
        this.socket = new DatagramSocket();
        this.logger = new Logger(clientId);
    }

    protected abstract void start();

    protected void sendPacket(int packetNumber, int packetSize, InetAddress serverAddr) {
        try {
            Packet packet = new Packet(new byte[packetSize], packetNumber);
            long startTime = System.currentTimeMillis();
            
            // Send packet
            byte[] data = UDPProtocol.serialize(packet);
            DatagramPacket datagramPacket = new DatagramPacket(
                data, data.length, serverAddr, SERVER_PORT);
            socket.send(datagramPacket);

            // Wait for acknowledgment
            socket.setSoTimeout(2000);
            byte[] receiveData = new byte[packetSize];
            DatagramPacket receivePacket = new DatagramPacket(receiveData, receiveData.length);
            socket.receive(receivePacket);

            long rtt = System.currentTimeMillis() - startTime;
            rtts.add(rtt);
            successfulPackets++;
            
            logger.logPacket(packetNumber, rtt, true, packetSize);
            System.out.printf("Packet %d sent successfully, RTT: %dms%n", packetNumber, rtt);

        } 
		catch (Exception e) {
            logger.logPacket(packetNumber, 0, false, packetSize);
            System.out.printf("Failed to send packet %d: %s%n", packetNumber, e.getMessage());
        }
		
		
    }
	

    protected void printSummary() {
        double avgRtt = rtts.stream().mapToLong(Long::longValue).average().orElse(0.0);
        System.out.printf("\n=== Client %s Summary ===\n", clientId);
        System.out.printf("Successful Packets: %d\n", successfulPackets);
        System.out.printf("Average RTT: %.2f ms\n", avgRtt);
        logger.logSummary(avgRtt, successfulPackets, rtts.size());
    }

    protected void close() {
        if (socket != null) {
            socket.close();
        }
        logger.close();
    }
} 

// compute time after sending packet and time to recieve it 
// find what is causing the delay in connection between client and server connection 
// things left to do  
