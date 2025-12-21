package urbane.urbanewebapp.dto.request;

import lombok.Data;

@Data
public class CognitoConfirmRequest {
    private String email;
    private String confirmationCode;
}

