package urbane.urbanewebapp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "friend_connections")
public class FriendConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "connection_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    @JsonIgnore
    private User requester;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    @JsonIgnore
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ConnectionStatus status;

    public enum ConnectionStatus {
        PENDING,    // Friend request sent, waiting for response
        ACCEPTED,   // Friend request accepted
        REJECTED    // Friend request rejected
    }

    // Helper methods to get IDs for JSON serialization
    public Long getRequesterId() {
        return requester != null ? requester.getId() : null;
    }

    public Long getReceiverId() {
        return receiver != null ? receiver.getId() : null;
    }
}


