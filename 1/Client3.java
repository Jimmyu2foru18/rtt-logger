import java.net.InetAddress;
import java.net.SocketException;

public class Client3 extends Client {
    private static final int PACKET_SIZE = 40000;
    private static final int NUM_PACKETS = 100;

    public Client3() throws SocketException {
        super("3");
    }

    @Override
    public void start() {
        try {
            System.out.println("Starting Bulk Transfer Client");
            System.out.printf("Preparing to send %d packets\n", NUM_PACKETS);
            InetAddress serverAddr = InetAddress.getByName(SERVER_ADDRESS);

            long startTime = System.currentTimeMillis();
            
            for (int i = 0; i < NUM_PACKETS; i++) {
                sendPacket(i, PACKET_SIZE, serverAddr);
                // every 10 packets delay to check progress
                if ((i + 1) % 10 == 0) {
                    System.out.printf("Progress: %d%%\n", ((i + 1) * 100) / NUM_PACKETS);
                    Thread.sleep(200); 
                }
            }

            long totalTime = System.currentTimeMillis() - startTime;
            System.out.printf("\nTotal transfer time: %.2f seconds\n", totalTime / 1000.0);
            printSummary();
            
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            close();
        }
    }

    public static void main(String[] args) throws SocketException {
        new Client3().start();
    }
} 