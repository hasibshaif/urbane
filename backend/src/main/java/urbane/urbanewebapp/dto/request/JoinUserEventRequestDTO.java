package urbane.urbanewebapp.dto.request;

import lombok.Data;

@Data
public class JoinUserEventRequestDTO {
    public long userId;
    public long eventId;
    public boolean rsvpStatus;
}
