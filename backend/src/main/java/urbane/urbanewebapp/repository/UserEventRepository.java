package urbane.urbanewebapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import urbane.urbanewebapp.model.UserEvent;
import urbane.urbanewebapp.model.UserEventId;

import java.util.List;

public interface UserEventRepository extends JpaRepository<UserEvent, UserEventId> {
    List<UserEvent> findByEventIdAndRsvpStatusTrue(Long eventId);
    List<UserEvent> findByUserIdAndRsvpStatusTrue(Long userId);
    Long countByRsvpStatusTrueAndEventId(Long eventId);
    void deleteUserEventByUserIdAndEventId(Long userId, Long eventId);

}
