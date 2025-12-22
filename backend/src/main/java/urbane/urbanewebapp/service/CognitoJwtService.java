package urbane.urbanewebapp.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.Map;

@Service
public class CognitoJwtService {

    @Value("${cognito.userPoolId:}")
    private String userPoolId;

    @Value("${cognito.region:us-east-1}")
    private String region;

    private static final String JWK_URL_TEMPLATE = "https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json";

    public DecodedJWT verifyToken(String token) throws JWTVerificationException {
        try {
            DecodedJWT jwt = JWT.decode(token);
            String kid = jwt.getKeyId();
            
            // For production, you should cache the JWKs
            // For now, we'll fetch them each time
            String jwksUrl = String.format(JWK_URL_TEMPLATE, region, userPoolId);
            Map<String, Object> jwks = fetchJwks(jwksUrl);
            
            // Get the public key for this key ID
            RSAPublicKey publicKey = getPublicKey(jwks, kid);
            
            // Verify the token
            Algorithm algorithm = Algorithm.RSA256(publicKey, null);
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer(String.format("https://cognito-idp.%s.amazonaws.com/%s", region, userPoolId))
                    .build();
            
            return verifier.verify(token);
        } catch (Exception e) {
            throw new JWTVerificationException("Token verification failed: " + e.getMessage());
        }
    }

    public String getSubFromToken(String token) {
        try {
            DecodedJWT jwt = verifyToken(token);
            return jwt.getSubject();
        } catch (JWTVerificationException e) {
            return null;
        }
    }

    public String getEmailFromToken(String token) {
        try {
            DecodedJWT jwt = verifyToken(token);
            return jwt.getClaim("email").asString();
        } catch (JWTVerificationException e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchJwks(String jwksUrl) throws Exception {
        URL url = new URL(jwksUrl);
        java.io.InputStream inputStream = url.openStream();
        String jwksJson = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        inputStream.close();
        
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        return mapper.readValue(jwksJson, Map.class);
    }

    @SuppressWarnings("unchecked")
    private RSAPublicKey getPublicKey(Map<String, Object> jwks, String kid) throws Exception {
        Map<String, Object> keys = (Map<String, Object>) jwks.get("keys");
        
        if (keys == null) {
            throw new Exception("No keys found in JWKS");
        }
        
        Map<String, Object> key = null;
        for (Map.Entry<String, Object> entry : keys.entrySet()) {
            Map<String, Object> k = (Map<String, Object>) entry.getValue();
            if (kid.equals(k.get("kid"))) {
                key = k;
                break;
            }
        }
        
        if (key == null) {
            throw new Exception("Key ID not found in JWKS");
        }
        
        // Extract modulus and exponent
        String modulus = (String) key.get("n");
        String exponent = (String) key.get("e");
        
        // Decode base64url to BigInteger
        BigInteger modulusBigInt = new BigInteger(1, Base64.getUrlDecoder().decode(modulus));
        BigInteger exponentBigInt = new BigInteger(1, Base64.getUrlDecoder().decode(exponent));
        
        // Create RSA public key
        RSAPublicKeySpec spec = new RSAPublicKeySpec(modulusBigInt, exponentBigInt);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return (RSAPublicKey) keyFactory.generatePublic(spec);
    }
}



