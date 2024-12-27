import java.net.InetAddress;
import java.net.SocketException;

public class Client1 extends Client {
    private static final int PACKET_SIZE = 1024;
    private static final int NUM_PACKETS = 5;

    public Client1() throws SocketException {
        super("1");
    }

    @Override
    public void start() {
        try {
            System.out.println("Starting Basic Transfer Client");
            InetAddress serverAddr = InetAddress.getByName(SERVER_ADDRESS);

            for (int i = 0; i < NUM_PACKETS; i++) {
                sendPacket(i, PACKET_SIZE, serverAddr);
                //delay between packets
                Thread.sleep(100); 
            }

            printSummary();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            close();
        }
    }

    public static void main(String[] args) throws SocketException {
        new Client1().start();
    }
} 