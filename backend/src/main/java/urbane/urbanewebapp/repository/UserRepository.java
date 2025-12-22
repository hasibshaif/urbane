package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import urbane.urbanewebapp.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByCognitoSub(String cognitoSub);
    
    // Fetch users with their interests and profiles eagerly
    @EntityGraph(attributePaths = {"interests", "profile", "profile.location"})
    @Query("SELECT u FROM User u")
    List<User> findAllWithInterests();
}
