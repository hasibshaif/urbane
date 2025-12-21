package urbane.urbanewebapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AuthenticationResultType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.InitiateAuthResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ConfirmSignUpResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.NotAuthorizedException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.SignUpResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotConfirmedException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;
import urbane.urbanewebapp.dto.request.CognitoConfirmRequest;
import urbane.urbanewebapp.dto.request.CognitoLoginRequest;
import urbane.urbanewebapp.dto.request.CognitoRegisterRequest;
import urbane.urbanewebapp.model.User;
import urbane.urbanewebapp.repository.UserRepository;
import urbane.urbanewebapp.service.CognitoService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private CognitoService cognitoService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody CognitoRegisterRequest request) {
        try {
            // Check if user already exists in our database
            if (userRepository.existsByEmail(request.getEmail())) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Email already registered");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Register user in Cognito
            SignUpResponse signUpResponse = cognitoService.signUp(request.getEmail(), request.getPassword());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registration successful. Please check your email for verification code.");
            response.put("userSub", signUpResponse.userSub());
            response.put("email", request.getEmail());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error registering user: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirm(@RequestBody CognitoConfirmRequest request) {
        boolean alreadyConfirmed = false;
        
        try {
            // Confirm user in Cognito
            ConfirmSignUpResponse confirmResponse = cognitoService.confirmSignUp(request.getEmail(), request.getConfirmationCode());
        } catch (Exception e) {
            // Check if user is already confirmed
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("CONFIRMED")) {
                // User is already confirmed, which is fine - proceed with database creation
                alreadyConfirmed = true;
                System.out.println("User is already confirmed in Cognito, proceeding with database setup");
            } else {
                // Some other error occurred
                System.err.println("Error confirming user: " + errorMessage);
                e.printStackTrace();
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", errorMessage);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
        }

        // Create user in database (whether newly confirmed or already confirmed)
        // Note: cognitoSub will be set on first login when we decode the ID token
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(null); // Explicitly set to null since we use Cognito for auth
        // Try to get cognitoSub, but don't fail if we can't
        try {
            String cognitoSub = cognitoService.getUserSub(request.getEmail());
            user.setCognitoSub(cognitoSub);
        } catch (Exception e) {
            // Will be set on first login
            System.out.println("Could not get cognitoSub during confirmation, will set on first login");
        }
        
        // Check if user already exists (in case of race condition)
        if (!userRepository.existsByEmail(request.getEmail())) {
            userRepository.save(user);
        }

        Map<String, Object> response = new HashMap<>();
        if (alreadyConfirmed) {
            response.put("message", "Email already verified. You can now sign in.");
        } else {
            response.put("message", "Email verified successfully");
        }
        response.put("email", request.getEmail());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody CognitoLoginRequest request) {
        try {
            // Authenticate with Cognito
            InitiateAuthResponse authResponse = cognitoService.initiateAuth(request.getEmail(), request.getPassword());
            
            // Check if there's a challenge (e.g., NEW_PASSWORD_REQUIRED)
            if (authResponse.challengeName() != null) {
                Map<String, Object> errorResponse = new HashMap<>();
                String challengeName = authResponse.challengeName().toString();
                if ("NEW_PASSWORD_REQUIRED".equals(challengeName)) {
                    errorResponse.put("error", "New password required. Please set a new password.");
                    errorResponse.put("challenge", challengeName);
                } else {
                    errorResponse.put("error", "Authentication challenge: " + challengeName);
                    errorResponse.put("challenge", challengeName);
                }
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            AuthenticationResultType authResult = authResponse.authenticationResult();

            // Extract sub from ID token (more reliable than AdminGetUser)
            String cognitoSub = null;
            try {
                // Decode ID token to get sub
                com.auth0.jwt.interfaces.DecodedJWT jwt = com.auth0.jwt.JWT.decode(authResult.idToken());
                cognitoSub = jwt.getSubject();
            } catch (Exception e) {
                // Fallback to AdminGetUser
                cognitoSub = cognitoService.getUserSub(request.getEmail());
            }
            
            // Make cognitoSub effectively final for lambda usage
            final String finalCognitoSub = cognitoSub;

            // Get or create user in database
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setEmail(request.getEmail());
                        newUser.setCognitoSub(finalCognitoSub);
                        return userRepository.save(newUser);
                    });

            // Update cognitoSub if it's missing or incorrect
            if (cognitoSub != null && !cognitoSub.equals(user.getCognitoSub())) {
                user.setCognitoSub(cognitoSub);
                userRepository.save(user);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("accessToken", authResult.accessToken());
            response.put("idToken", authResult.idToken());
            response.put("refreshToken", authResult.refreshToken());
            response.put("user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail()
            ));
            
            return ResponseEntity.ok(response);
        } catch (software.amazon.awssdk.services.cognitoidentityprovider.model.NotAuthorizedException e) {
            System.err.println("NotAuthorizedException: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("Incorrect username or password")) {
                errorResponse.put("error", "Incorrect email or password");
            } else if (errorMessage != null && errorMessage.contains("User is disabled")) {
                errorResponse.put("error", "User account is disabled");
            } else {
                errorResponse.put("error", "Authentication failed: " + errorMessage);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        } catch (software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException e) {
            System.err.println("UserNotFoundException: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "User not found. Please check your email address.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        } catch (software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotConfirmedException e) {
            System.err.println("UserNotConfirmedException: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Email not verified. Please verify your email address.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        } catch (Exception e) {
            System.err.println("Error logging in user: " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getName());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    @PostMapping("/resend-code")
    public ResponseEntity<Map<String, Object>> resendConfirmationCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            cognitoService.resendConfirmationCode(email);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Verification code resent successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error resending code: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}

