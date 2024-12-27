import java.io.*;

public class UDPProtocol {
                                    // Maximum UDP packet
    public static final int MAX_PACKET_SIZE = 65507; 

    public static byte[] serialize(Packet packet) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ObjectOutputStream oos = new ObjectOutputStream(baos)) {
            oos.writeObject(packet);
        }
        return baos.toByteArray();
    }

    public static Packet deserialize(byte[] data) throws IOException, ClassNotFoundException 
    {
        try (ByteArrayInputStream bais = new ByteArrayInputStream(data);
             ObjectInputStream ois = new ObjectInputStream(bais)) {
            return (Packet) ois.readObject();
        }
    }
} 