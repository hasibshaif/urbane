package urbane.urbanewebapp.dto.response;

import lombok.Data;

@Data
public class UserEventDTO {
    public long userId;
    public long eventId;
    public boolean rsvpStatus;



    public String title;
    public String description;
    public String city;
    public String country;
    public String state;
}
