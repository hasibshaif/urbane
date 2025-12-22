package urbane.urbanewebapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;
import software.amazon.awssdk.core.exception.SdkClientException;

import java.util.HashMap;
import java.util.Map;

@Service
public class CognitoService {

    @Value("${cognito.userPoolId:${COGNITO_USER_POOL_ID:}}")
    private String userPoolId;

    @Value("${cognito.clientId:${COGNITO_CLIENT_ID:}}")
    private String clientId;

    @Value("${cognito.region:${COGNITO_REGION:us-east-1}}")
    private String region;

    private CognitoIdentityProviderClient getCognitoClient() {
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    public SignUpResponse signUp(String email, String password) {
        CognitoIdentityProviderClient cognitoClient = getCognitoClient();
        
        try {
            AttributeType emailAttribute = AttributeType.builder()
                    .name("email")
                    .value(email)
                    .build();

            SignUpRequest signUpRequest = SignUpRequest.builder()
                    .clientId(clientId)
                    .username(email)
                    .password(password)
                    .userAttributes(emailAttribute)
                    .build();

            return cognitoClient.signUp(signUpRequest);
        } finally {
            cognitoClient.close();
        }
    }

    public ConfirmSignUpResponse confirmSignUp(String email, String confirmationCode) {
        CognitoIdentityProviderClient cognitoClient = getCognitoClient();
        
        try {
            ConfirmSignUpRequest confirmRequest = ConfirmSignUpRequest.builder()
                    .clientId(clientId)
                    .username(email)
                    .confirmationCode(confirmationCode)
                    .build();

            return cognitoClient.confirmSignUp(confirmRequest);
        } finally {
            cognitoClient.close();
        }
    }

    public ResendConfirmationCodeResponse resendConfirmationCode(String email) {
        CognitoIdentityProviderClient cognitoClient = getCognitoClient();
        
        try {
            ResendConfirmationCodeRequest resendRequest = ResendConfirmationCodeRequest.builder()
                    .clientId(clientId)
                    .username(email)
                    .build();

            return cognitoClient.resendConfirmationCode(resendRequest);
        } finally {
            cognitoClient.close();
        }
    }

    public InitiateAuthResponse initiateAuth(String email, String password) {
        // Validate configuration
        if (clientId == null || clientId.isEmpty()) {
            throw new IllegalStateException("Cognito Client ID is not configured. Please set cognito.clientId or COGNITO_CLIENT_ID environment variable.");
        }
        if (userPoolId == null || userPoolId.isEmpty()) {
            throw new IllegalStateException("Cognito User Pool ID is not configured. Please set cognito.userPoolId or COGNITO_USER_POOL_ID environment variable.");
        }
        
        CognitoIdentityProviderClient cognitoClient = getCognitoClient();
        
        try {
            Map<String, String> authParams = new HashMap<>();
            authParams.put("USERNAME", email);
            authParams.put("PASSWORD", password);

            InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
                    .clientId(clientId)
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                    .authParameters(authParams)
                    .build();

            return cognitoClient.initiateAuth(authRequest);
        } catch (InvalidParameterException e) {
            // More specific error handling for validation errors
            String errorMsg = e.getMessage();
            if (errorMsg != null && (errorMsg.contains("validation") || errorMsg.contains("InvalidParameter"))) {
                throw new IllegalStateException(
                    "Cognito authentication failed: The app client may not have USER_PASSWORD_AUTH enabled, " +
                    "or the clientId/userPoolId may be incorrect. " +
                    "Please check your Cognito User Pool App Client settings in AWS Console. " +
                    "Error: " + errorMsg, e);
            }
            throw e;
        } catch (SdkClientException e) {
            // Handle AWS SDK client errors (e.g., missing credentials, network issues)
            String errorMsg = e.getMessage();
            throw new IllegalStateException(
                "Cognito client error: " + errorMsg + 
                ". Please check your AWS credentials and Cognito configuration.", e);
        } finally {
            cognitoClient.close();
        }
    }

    public AdminGetUserResponse getUser(String email) {
        CognitoIdentityProviderClient cognitoClient = getCognitoClient();
        
        try {
            AdminGetUserRequest getUserRequest = AdminGetUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(email)
                    .build();

            return cognitoClient.adminGetUser(getUserRequest);
        } finally {
            cognitoClient.close();
        }
    }

    public String getUserSub(String email) {
        try {
            AdminGetUserResponse userResponse = getUser(email);
            // Try to get sub from user attributes first
            return userResponse.userAttributes().stream()
                    .filter(attr -> attr.name().equals("sub"))
                    .findFirst()
                    .map(AttributeType::value)
                    .orElse(userResponse.username()); // Fallback to username if sub not found
        } catch (Exception e) {
            return null;
        }
    }
}

