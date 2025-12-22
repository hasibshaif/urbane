package urbane.urbanewebapp.dto.request;

import lombok.Data;

@Data
public class CognitoLoginRequest {
    private String email;
    private String password;
}


