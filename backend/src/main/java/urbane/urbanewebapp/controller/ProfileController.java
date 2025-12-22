package urbane.urbanewebapp.controller;


import jakarta.persistence.Id;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import urbane.urbanewebapp.model.Profile;
import urbane.urbanewebapp.model.User;
import urbane.urbanewebapp.model.Interest;
import urbane.urbanewebapp.repository.ProfileRepository;
import urbane.urbanewebapp.repository.UserRepository;
import urbane.urbanewebapp.repository.InterestRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
public class ProfileController {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InterestRepository interestRepository;

    //fetch profile

    @GetMapping("/fetchProfile/{id}")
    public ResponseEntity<Map<String, Object>> fetchProfile(@PathVariable Long id) {
        Profile profile = profileRepository.findById(id).orElse(null);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Build response without circular references
        Map<String, Object> profileData = new HashMap<>();
        profileData.put("id", profile.getId());
        profileData.put("firstName", profile.getFirstName());
        profileData.put("lastName", profile.getLastName());
        profileData.put("age", profile.getAge());
        profileData.put("photo", profile.getPhoto());
        profileData.put("bio", profile.getBio());
        profileData.put("travelStyle", profile.getTravelStyle());
        profileData.put("languages", profile.getLanguages()); // JSON string, frontend will parse
        if (profile.getLocation() != null) {
            Map<String, Object> locationData = new HashMap<>();
            locationData.put("id", profile.getLocation().getId());
            locationData.put("city", profile.getLocation().getCity());
            locationData.put("state", profile.getLocation().getState());
            locationData.put("country", profile.getLocation().getCountry());
            locationData.put("latitude", profile.getLocation().getLatitude());
            locationData.put("longitude", profile.getLocation().getLongitude());
            profileData.put("location", locationData);
        }
        
        return ResponseEntity.ok(profileData);
    }
    @PutMapping("/updateProfile/{id}")
    public ResponseEntity<Profile> updateProfile(@PathVariable Long id, @RequestBody Profile profile) {
        Profile existingProfile = profileRepository.findById(id).orElse(null);
        if (existingProfile == null) {
            return ResponseEntity.notFound().build();
        } else {
            existingProfile.setFirstName(profile.getFirstName());
            existingProfile.setLastName(profile.getLastName());
            existingProfile.setAge(profile.getAge());
            existingProfile.setLocation(profile.getLocation());
            existingProfile.setPhoto(profile.getPhoto());
            existingProfile.setBio(profile.getBio());
            profileRepository.save(existingProfile);
        }
        return ResponseEntity.ok(existingProfile);
    }


    @DeleteMapping("/deleteProfile/{id}")
    public ResponseEntity<HttpStatus> deleteProfile(@PathVariable Long id) {
        Profile profile = profileRepository.findById(id).orElse(null);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        } else {
            profileRepository.deleteById(id);
        }
        return ResponseEntity.ok(HttpStatus.OK);
    }

    @PostMapping("/saveProfile/{userId}")
    public ResponseEntity<Profile> saveProfile(@RequestBody Profile profile, @PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            // Check if profile already exists
            Profile existingProfile = profileRepository.findById(userId).orElse(null);
            if (existingProfile != null) {
                // Update existing profile
                existingProfile.setFirstName(profile.getFirstName());
                existingProfile.setLastName(profile.getLastName());
                existingProfile.setAge(profile.getAge());
                existingProfile.setPhoto(profile.getPhoto());
                existingProfile.setLocation(profile.getLocation());
                existingProfile.setPhoneNumber(profile.getPhoneNumber());
                existingProfile.setBio(profile.getBio());
                existingProfile.setTravelStyle(profile.getTravelStyle());
                existingProfile.setLanguages(profile.getLanguages());
                Profile savedProfile = profileRepository.save(existingProfile);
                return ResponseEntity.ok(savedProfile);
            } else {
                // Create new profile
                profile.setUser(user);
                Profile savedProfile = profileRepository.save(profile);
                user.setProfile(savedProfile);
                userRepository.save(user);
                return ResponseEntity.ok(savedProfile);
            }
        } catch (Exception e) {
            System.err.println("Error saving profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update editable profile fields (bio, photo, interests)
     * Does NOT allow updating: firstName, lastName, age, email
     */
    @PutMapping("/updateProfileEditable/{userId}")
    public ResponseEntity<Map<String, Object>> updateProfileEditable(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> updateData) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            Profile existingProfile = profileRepository.findById(userId).orElse(null);
            if (existingProfile == null) {
                return ResponseEntity.notFound().build();
            }

            // Update only editable fields
            if (updateData.containsKey("bio")) {
                existingProfile.setBio((String) updateData.get("bio"));
            }
            if (updateData.containsKey("photo")) {
                existingProfile.setPhoto((String) updateData.get("photo"));
            }
            if (updateData.containsKey("travelStyle")) {
                existingProfile.setTravelStyle((String) updateData.get("travelStyle"));
            }
            if (updateData.containsKey("languages")) {
                // Languages come as array, convert to JSON string
                if (updateData.get("languages") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<String> languagesList = (List<String>) updateData.get("languages");
                    existingProfile.setLanguages(String.join(",", languagesList)); // Store as comma-separated
                } else if (updateData.get("languages") instanceof String) {
                    existingProfile.setLanguages((String) updateData.get("languages"));
                }
            }

            profileRepository.save(existingProfile);

            // Update interests if provided
            if (updateData.containsKey("interests") && updateData.get("interests") instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> interestNames = (List<String>) updateData.get("interests");
                
                List<Interest> interests = new ArrayList<>();
                for (String interestName : interestNames) {
                    Interest interest = interestRepository.findByName(interestName)
                            .orElseGet(() -> {
                                Interest newInterest = new Interest();
                                newInterest.setName(interestName);
                                return interestRepository.save(newInterest);
                            });
                    interests.add(interest);
                }
                
                user.setInterests(interests);
                userRepository.save(user);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile updated successfully");
            response.put("profile", existingProfile);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error updating profile: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update profile: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    

}
