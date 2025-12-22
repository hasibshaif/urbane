package urbane.urbanewebapp.dto.request;

import lombok.Data;

@Data
public class CognitoRegisterRequest {
    private String email;
    private String password;
}



