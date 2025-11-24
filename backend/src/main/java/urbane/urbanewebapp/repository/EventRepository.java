package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import urbane.urbanewebapp.model.Event;

public interface EventRepository extends JpaRepository<Event, Long> {
}
