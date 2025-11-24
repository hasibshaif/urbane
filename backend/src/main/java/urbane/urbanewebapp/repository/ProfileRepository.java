package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import urbane.urbanewebapp.model.Profile;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
}
