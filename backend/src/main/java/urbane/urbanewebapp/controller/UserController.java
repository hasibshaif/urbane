package urbane.urbanewebapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import urbane.urbanewebapp.model.User;
import urbane.urbanewebapp.repository.UserRepository;

@RestController
public class UserController {

    @Autowired
    private UserRepository userRepository;

    //store user (name, email, password) if email already exists throw an error

    @PostMapping("/addUser")
    public ResponseEntity<User> addUser(@RequestBody User user) {

        //check if email exists. if user already exists throw an error

        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().build(); //return 400 if user email already exists
        }
        return ResponseEntity.ok(userRepository.save(user)); //return 200 and save the user being added

    }
    //get user by id if they exist
    @GetMapping("/fetchUserById/{id}")
    public ResponseEntity<User> fetchUser(@PathVariable long id) {

        User user = userRepository.findById(id).orElse(null);
        if  (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);



    }

    //fetch by email
    @GetMapping("/fetchUserByEmail/{email}")
    public  ResponseEntity<User> fetchUserByEmail(@PathVariable String email) {
        User user  = userRepository.findByEmail(email).orElse(null);
        if  (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);

    }


    //update user info
    @PutMapping("/updateUser/{id}")
    public ResponseEntity<User> updateUser(@RequestBody User user,  @PathVariable long id) {

        User existingUser = userRepository.findById(id).orElse(null);

        if (existingUser != null) {
            existingUser.setEmail(user.getEmail());
            existingUser.setPassword(user.getPassword());
            userRepository.save(existingUser);
        } else {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(user);
    }

    //delete user info
    @DeleteMapping("/deleteUser/{id}")
    public ResponseEntity<HttpStatus> deleteUser(@PathVariable long id) {

        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            userRepository.deleteById(id);
        } else {
            return ResponseEntity.badRequest().build();
        }
        return new ResponseEntity<>(HttpStatus.OK);
    }





}
