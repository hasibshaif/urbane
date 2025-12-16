package urbane.urbanewebapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import urbane.urbanewebapp.model.Interest;
import urbane.urbanewebapp.model.User;
import urbane.urbanewebapp.repository.InterestRepository;
import urbane.urbanewebapp.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;

@RestController
public class InterestController {

    @Autowired
    private InterestRepository interestRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all interests
    @GetMapping("/getAllInterests")
    public ResponseEntity<List<Interest>> getAllInterests() {
        return ResponseEntity.ok(interestRepository.findAll());
    }

    // Add interests to a user
    @PostMapping("/addInterestsToUser/{userId}")
    public ResponseEntity<User> addInterestsToUser(
            @PathVariable Long userId,
            @RequestBody List<String> interestNames) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

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
        return ResponseEntity.ok(userRepository.save(user));
    }
}

