package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import urbane.urbanewebapp.model.UserEvent;

public interface UserEventRepository extends JpaRepository<UserEvent, Long> {
}
