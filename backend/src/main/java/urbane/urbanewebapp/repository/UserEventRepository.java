package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.ResponseEntity;
import urbane.urbanewebapp.model.User;
import urbane.urbanewebapp.model.UserEvent;

import java.util.List;

public interface UserEventRepository extends JpaRepository<UserEvent, Long> {
    List<UserEvent> findByEventIdAndRsvpStatusTrue(Long eventId);
    List<UserEvent> findByUserIdAndRsvpStatusTrue(Long userId);
    Long countByRsvpStatusTrueAndEventId(Long eventId);
    void deleteUserEventByUserIdAndEventId(Long userId, Long eventId);

}
