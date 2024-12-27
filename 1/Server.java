import java.net.*;

public class Server {
    private static final int PORT = 5000;
    private final DatagramSocket socket;
    private boolean running = true;

    public Server() throws SocketException {
        this.socket = new DatagramSocket(PORT);
        socket.setReceiveBufferSize(65535);
        socket.setSendBufferSize(65535);
    }

    public void start() {
        try {
            System.out.println("=== UDP Server Started ===");
            System.out.println("Listening on port: " + PORT);
            System.out.printf("Buffer sizes: Send=%d, Receive=%d\n", 
                socket.getSendBufferSize(), socket.getReceiveBufferSize());
        } catch (SocketException e) {
            System.err.println("Error retrieving buffer sizes: " + e.getMessage());
        }

        while (running == true){
            try {
                // Receive packet
                byte[] receiveData = new byte[65507];
                DatagramPacket receivePacket = new DatagramPacket(receiveData, receiveData.length);
                socket.receive(receivePacket);

                InetAddress clientAddress = receivePacket.getAddress();
                int clientPort = receivePacket.getPort();
                Packet packet = UDPProtocol.deserialize(receivePacket.getData());
                
                System.out.printf("Received packet %d from %s:%d (size: %d bytes)\n", 
                    packet.getSequenceNumber(), 
                    clientAddress.getHostAddress(), 
                    clientPort,
                    receivePacket.getLength());

                // Send ack
                packet.setAck(true);
                byte[] sendData = UDPProtocol.serialize(packet);
                DatagramPacket sendPacket = new DatagramPacket(
                    sendData, sendData.length, clientAddress, clientPort);
                socket.send(sendPacket);

            } catch (Exception e) {
                if (running) {
                    System.out.println("Error processing packet: " + e.getMessage());
                }
            }
        }
    }

    public void stop() {
        running = false;
        socket.close();
        System.out.println("Server stopped.");
    }

    public static void main(String[] args) throws SocketException {
        new Server().start();
    }
}
