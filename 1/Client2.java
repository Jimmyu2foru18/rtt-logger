import java.net.InetAddress;
import java.net.SocketException;

public class Client2 extends Client {
    private static final int PACKET_SIZE = 60000;
    private static final int NUM_PACKETS = 5;

    public Client2() throws SocketException {
        super("2");
        socket.setSendBufferSize(65535);
        socket.setReceiveBufferSize(65535);
    }

    @Override
    public void start() {
        try {
            System.out.println("Starting Large Packet Transfer Client");
            InetAddress serverAddr = InetAddress.getByName(SERVER_ADDRESS);

            for (int i = 0; i < NUM_PACKETS; i++) {
                sendPacket(i, PACKET_SIZE, serverAddr);
                Thread.sleep(200);
            }

            printSummary();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            close();
        }
    }

    public static void main(String[] args) throws SocketException {
        new Client2().start();
    }
} 