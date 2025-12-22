package urbane.urbanewebapp.controller;


import jakarta.persistence.Id;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import urbane.urbanewebapp.model.Profile;
import urbane.urbanewebapp.model.User;
import urbane.urbanewebapp.repository.ProfileRepository;
import urbane.urbanewebapp.repository.UserRepository;

@RestController
public class ProfileController {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    //fetch profile

    @GetMapping("/fetchProfile/{id}")
    public ResponseEntity<Profile> fetchProfile(@PathVariable Long id) {
        Profile profile = profileRepository.findById(id).orElse(null);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profile);

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
    

}
