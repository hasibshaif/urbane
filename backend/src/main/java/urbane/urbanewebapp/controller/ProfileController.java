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
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        profile.setUser(user);
        Profile savedProfile = profileRepository.save(profile);

        user.setProfile(savedProfile);
        userRepository.save(user);
        return ResponseEntity.ok(profile);
    }
    

}
