package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import urbane.urbanewebapp.model.Profile;

import javax.swing.text.html.Option;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {


}
