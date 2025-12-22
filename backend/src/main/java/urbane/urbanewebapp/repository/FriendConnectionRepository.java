package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import urbane.urbanewebapp.model.FriendConnection;
import urbane.urbanewebapp.model.User;

import java.util.List;
import java.util.Optional;

public interface FriendConnectionRepository extends JpaRepository<FriendConnection, Long> {
    
    // Find connection between two users (in either direction)
    @Query("SELECT fc FROM FriendConnection fc WHERE " +
           "(fc.requester.id = :userId1 AND fc.receiver.id = :userId2) OR " +
           "(fc.requester.id = :userId2 AND fc.receiver.id = :userId1)")
    Optional<FriendConnection> findConnectionBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    // Find all connections for a user (as requester or receiver)
    @Query("SELECT fc FROM FriendConnection fc WHERE " +
           "fc.requester.id = :userId OR fc.receiver.id = :userId")
    List<FriendConnection> findAllConnectionsForUser(@Param("userId") Long userId);
    
    // Find pending requests received by a user
    @Query("SELECT fc FROM FriendConnection fc WHERE " +
           "fc.receiver.id = :userId AND fc.status = 'PENDING'")
    List<FriendConnection> findPendingRequestsForUser(@Param("userId") Long userId);
    
    // Find accepted connections for a user
    @Query("SELECT fc FROM FriendConnection fc WHERE " +
           "((fc.requester.id = :userId OR fc.receiver.id = :userId) AND fc.status = 'ACCEPTED')")
    List<FriendConnection> findAcceptedConnectionsForUser(@Param("userId") Long userId);
}


