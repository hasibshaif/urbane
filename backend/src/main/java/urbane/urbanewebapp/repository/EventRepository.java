package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import urbane.urbanewebapp.model.Event;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {



    List<Event> findEventsByState(String state);
    List<Event> findEventsByStateAndCity(String state, String city);
}
