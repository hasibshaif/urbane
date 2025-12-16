package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import urbane.urbanewebapp.model.Interest;

import java.util.Optional;

public interface InterestRepository extends JpaRepository<Interest, Long> {
    Optional<Interest> findByName(String name);
}
