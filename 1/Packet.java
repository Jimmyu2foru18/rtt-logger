import java.io.Serializable;
import java.util.UUID;

public class Packet implements Serializable 
{                    //This verifys sender and receiver are compatible.
    private static final long serialVersionUID = 1L;
                    //unique identifier.
    private final UUID id;
    private final byte[] data;
    private final int sequenceNumber;
    private boolean isAck;

    public Packet(byte[] data, int sequenceNumber)
    {
        this.id = UUID.randomUUID();
        this.data = data;
        this.sequenceNumber = sequenceNumber;
        this.isAck = false;
    }

    // Getteers and setters
    public UUID getId() { return id; }
    public byte[] getData() { return data; }
    public int getSequenceNumber() { return sequenceNumber; }
    public boolean isAck() { return isAck; }

    public void setAck(boolean ack) { this.isAck = ack; }
} 