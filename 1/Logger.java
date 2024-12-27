import java.io.*;
import java.util.Date;

public class Logger {
    private final PrintWriter writer;
    private final String clientId;

    public Logger(String clientId) {
        this.clientId = clientId;
        try {
            new File("log").mkdirs();
            this.writer = new PrintWriter(new FileWriter("log/client" + clientId + ".log", true));
            writer.println("\n=== New Session Started at " + new Date() + " ===");
            writer.flush();
        } catch (IOException e) {
            throw new RuntimeException("Failed to create logger", e);
        }
    }

    public void logPacket(int packetNumber, long rtt, boolean success, int size) {
        writer.printf("Packet %d: %d bytes, RTT=%dms, %s%n", 
            packetNumber, size, rtt, success ? "SUCCESS" : "FAILED");
        writer.flush();
    }

    public void logSummary(double avgRtt, int total, int successful) {
        writer.printf("\nSummary: %d/%d packets successful, Average RTT: %.2fms%n", 
            successful, total, avgRtt);
        writer.flush();
    }

    public void close() {
        if (writer != null) writer.close();
    }
} 