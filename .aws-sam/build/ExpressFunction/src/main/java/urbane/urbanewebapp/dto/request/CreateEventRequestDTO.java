package urbane.urbanewebapp.dto.request;

import lombok.Data;

@Data
public class CreateEventRequestDTO {
    private String title;
    private String description;
    private Long capacity;
    private String date;
    private String state;
    private String country;
    private String city;
    private String latitude;
    private String longitude;
    private Long creatorId;
}

