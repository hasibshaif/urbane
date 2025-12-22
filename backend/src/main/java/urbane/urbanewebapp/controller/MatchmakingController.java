package urbane.urbanewebapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import urbane.urbanewebapp.model.*;
import urbane.urbanewebapp.repository.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
public class MatchmakingController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private FriendConnectionRepository friendConnectionRepository;

    @Autowired
    private InterestRepository interestRepository;

    /**
     * Get potential matches for a user based on similarities
     * Returns users with at least 1 similarity (interests, age range, location)
     */
    @GetMapping("/matchmaking/potential-matches/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getPotentialMatches(@PathVariable Long userId) {
        try {
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.notFound().build();
            }

            Profile currentProfile = currentUser.getProfile();
            if (currentProfile == null) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            // Get all users except current user (with interests eagerly fetched)
            List<User> allUsers = userRepository.findAllWithInterests().stream()
                    .filter(user -> !user.getId().equals(userId))
                    .filter(user -> user.getProfile() != null)
                    .collect(Collectors.toList());
            
            // Also ensure current user has interests loaded
            User currentUserWithInterests = userRepository.findAllWithInterests().stream()
                    .filter(user -> user.getId().equals(userId))
                    .findFirst()
                    .orElse(null);
            
            if (currentUserWithInterests != null) {
                currentUser = currentUserWithInterests;
            }

            // Get existing connections (to exclude users appropriately)
            List<FriendConnection> existingConnections = friendConnectionRepository.findAllConnectionsForUser(userId);
            // Exclude logic:
            // 1. Always exclude ACCEPTED (matched) and REJECTED users
            // 2. For PENDING: Only exclude if current user is the requester (they initiated, so don't show them again)
            //    If current user is the receiver, they should still see the requester (so they can respond)
            Set<Long> excludedUserIds = existingConnections.stream()
                    .filter(fc -> {
                        // Always exclude ACCEPTED and REJECTED
                        if (fc.getStatus() == FriendConnection.ConnectionStatus.ACCEPTED || 
                            fc.getStatus() == FriendConnection.ConnectionStatus.REJECTED) {
                            return true;
                        }
                        // For PENDING: only exclude if current user is the requester
                        // (if current user is receiver, they should still see the requester to respond)
                        if (fc.getStatus() == FriendConnection.ConnectionStatus.PENDING) {
                            return fc.getRequester().getId().equals(userId);
                        }
                        return false;
                    })
                    .map(fc -> {
                        if (fc.getRequester().getId().equals(userId)) {
                            return fc.getReceiver().getId();
                        } else {
                            return fc.getRequester().getId();
                        }
                    })
                    .collect(Collectors.toSet());

            // Get current user's interests
            Set<Long> currentUserInterestIds = currentUser.getInterests().stream()
                    .map(Interest::getId)
                    .collect(Collectors.toSet());

            List<Map<String, Object>> potentialMatches = new ArrayList<>();

            for (User user : allUsers) {
                // Skip if already matched or rejected
                if (excludedUserIds.contains(user.getId())) {
                    continue;
                }

                Profile profile = user.getProfile();
                if (profile == null) continue;

                // Check for similarities
                boolean hasSimilarity = false;
                List<String> similarities = new ArrayList<>();

                // Check shared interests
                Set<Long> userInterestIds = user.getInterests().stream()
                        .map(Interest::getId)
                        .collect(Collectors.toSet());
                userInterestIds.retainAll(currentUserInterestIds);
                if (!userInterestIds.isEmpty()) {
                    hasSimilarity = true;
                    List<String> sharedInterestNames = user.getInterests().stream()
                            .filter(interest -> userInterestIds.contains(interest.getId()))
                            .map(Interest::getName)
                            .collect(Collectors.toList());
                    similarities.add("Shared interests: " + String.join(", ", sharedInterestNames));
                }

                // Check age similarity (within 5 years)
                if (currentProfile.getAge() != null && profile.getAge() != null) {
                    long ageDiff = Math.abs(currentProfile.getAge() - profile.getAge());
                    if (ageDiff <= 5) {
                        hasSimilarity = true;
                        similarities.add("Similar age");
                    }
                }

                // Check location similarity
                if (currentProfile.getLocation() != null && profile.getLocation() != null) {
                    Location currentLoc = currentProfile.getLocation();
                    Location userLoc = profile.getLocation();
                    if (currentLoc.getCity() != null && userLoc.getCity() != null &&
                        currentLoc.getCity().equalsIgnoreCase(userLoc.getCity())) {
                        hasSimilarity = true;
                        similarities.add("Same city: " + userLoc.getCity());
                    } else if (currentLoc.getState() != null && userLoc.getState() != null &&
                               currentLoc.getState().equalsIgnoreCase(userLoc.getState())) {
                        hasSimilarity = true;
                        similarities.add("Same state: " + userLoc.getState());
                    } else if (currentLoc.getCountry() != null && userLoc.getCountry() != null &&
                               currentLoc.getCountry().equalsIgnoreCase(userLoc.getCountry())) {
                        hasSimilarity = true;
                        similarities.add("Same country: " + userLoc.getCountry());
                    }
                }

                // Check language similarity
                if (currentProfile.getLanguages() != null && profile.getLanguages() != null) {
                    String currentLanguages = currentProfile.getLanguages();
                    String userLanguages = profile.getLanguages();
                    if (!currentLanguages.isEmpty() && !userLanguages.isEmpty()) {
                        List<String> currentLangList = new ArrayList<>(Arrays.asList(currentLanguages.split(",")));
                        List<String> userLangList = new ArrayList<>(Arrays.asList(userLanguages.split(",")));
                        currentLangList.replaceAll(String::trim);
                        userLangList.replaceAll(String::trim);
                        
                        List<String> commonLanguages = new ArrayList<>(currentLangList);
                        commonLanguages.retainAll(userLangList);
                        
                        if (!commonLanguages.isEmpty()) {
                            hasSimilarity = true;
                            similarities.add("Common languages: " + String.join(", ", commonLanguages));
                        }
                    }
                }

                // Check travel style similarity
                if (currentProfile.getTravelStyle() != null && profile.getTravelStyle() != null) {
                    String currentTravelStyle = currentProfile.getTravelStyle().trim();
                    String userTravelStyle = profile.getTravelStyle().trim();
                    if (!currentTravelStyle.isEmpty() && !userTravelStyle.isEmpty()) {
                        // Match if same travel style, or if one is "flexible" or "mixed"
                        if (currentTravelStyle.equalsIgnoreCase(userTravelStyle) ||
                            currentTravelStyle.equalsIgnoreCase("flexible") ||
                            userTravelStyle.equalsIgnoreCase("flexible") ||
                            currentTravelStyle.equalsIgnoreCase("mixed") ||
                            userTravelStyle.equalsIgnoreCase("mixed")) {
                            hasSimilarity = true;
                            String styleLabel = userTravelStyle.equalsIgnoreCase("solo") ? "Solo traveler" :
                                              userTravelStyle.equalsIgnoreCase("group") ? "Group traveler" :
                                              userTravelStyle.equalsIgnoreCase("mixed") ? "Mix of both" :
                                              userTravelStyle.equalsIgnoreCase("flexible") ? "Flexible" : userTravelStyle;
                            similarities.add("Travel style: " + styleLabel);
                        }
                    }
                }

                if (hasSimilarity) {
                    Map<String, Object> matchData = new HashMap<>();
                    matchData.put("userId", user.getId());
                    matchData.put("email", user.getEmail());
                    
                    // Build profile data without circular references
                    Map<String, Object> profileData = new HashMap<>();
                    profileData.put("id", profile.getId());
                    profileData.put("firstName", profile.getFirstName());
                    profileData.put("lastName", profile.getLastName());
                    profileData.put("age", profile.getAge());
                    profileData.put("photo", profile.getPhoto());
                    profileData.put("bio", profile.getBio());
                    profileData.put("travelStyle", profile.getTravelStyle());
                    profileData.put("languages", profile.getLanguages());
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
                    matchData.put("profile", profileData);
                    
                    // Build interests data without circular references
                    List<Map<String, Object>> interestsData = user.getInterests().stream()
                            .map(interest -> {
                                Map<String, Object> interestData = new HashMap<>();
                                interestData.put("id", interest.getId());
                                interestData.put("name", interest.getName());
                                return interestData;
                            })
                            .collect(Collectors.toList());
                    matchData.put("interests", interestsData);
                    matchData.put("similarities", similarities);
                    potentialMatches.add(matchData);
                }
            }

            return ResponseEntity.ok(potentialMatches);
        } catch (Exception e) {
            System.err.println("Error finding potential matches: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get detailed profile of a user for matchmaking
     */
    @GetMapping("/matchmaking/user-profile/{userId}")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable Long userId) {
        try {
            // Use eager fetch to load interests
            User user = userRepository.findAllWithInterests().stream()
                    .filter(u -> u.getId().equals(userId))
                    .findFirst()
                    .orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> profileData = new HashMap<>();
            profileData.put("userId", user.getId());
            profileData.put("email", user.getEmail());
            
            // Build profile data without circular references
            if (user.getProfile() != null) {
                Profile profile = user.getProfile();
                Map<String, Object> profileMap = new HashMap<>();
                profileMap.put("id", profile.getId());
                profileMap.put("firstName", profile.getFirstName());
                profileMap.put("lastName", profile.getLastName());
                profileMap.put("age", profile.getAge());
                profileMap.put("photo", profile.getPhoto());
                profileMap.put("bio", profile.getBio());
                profileMap.put("travelStyle", profile.getTravelStyle());
                profileMap.put("languages", profile.getLanguages());
                if (profile.getLocation() != null) {
                    Map<String, Object> locationData = new HashMap<>();
                    locationData.put("id", profile.getLocation().getId());
                    locationData.put("city", profile.getLocation().getCity());
                    locationData.put("state", profile.getLocation().getState());
                    locationData.put("country", profile.getLocation().getCountry());
                    locationData.put("latitude", profile.getLocation().getLatitude());
                    locationData.put("longitude", profile.getLocation().getLongitude());
                    profileMap.put("location", locationData);
                }
                profileData.put("profile", profileMap);
            }
            
            // Build interests data without circular references
            List<Map<String, Object>> interestsData = user.getInterests().stream()
                    .map(interest -> {
                        Map<String, Object> interestData = new HashMap<>();
                        interestData.put("id", interest.getId());
                        interestData.put("name", interest.getName());
                        return interestData;
                    })
                    .collect(Collectors.toList());
            profileData.put("interests", interestsData);

            return ResponseEntity.ok(profileData);
        } catch (Exception e) {
            System.err.println("Error fetching user profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Send friend request (Yes - I want to be friends)
     */
    @PostMapping("/matchmaking/send-friend-request")
    public ResponseEntity<Map<String, Object>> sendFriendRequest(
            @RequestBody Map<String, Long> request) {
        try {
            Long requesterId = request.get("requesterId");
            Long receiverId = request.get("receiverId");

            if (requesterId == null || receiverId == null) {
                return ResponseEntity.badRequest().build();
            }

            User requester = userRepository.findById(requesterId).orElse(null);
            User receiver = userRepository.findById(receiverId).orElse(null);

            if (requester == null || receiver == null) {
                return ResponseEntity.notFound().build();
            }

            // Check if connection already exists
            Optional<FriendConnection> existingConnection = 
                friendConnectionRepository.findConnectionBetweenUsers(requesterId, receiverId);

            if (existingConnection.isPresent()) {
                FriendConnection connection = existingConnection.get();
                if (connection.getStatus() == FriendConnection.ConnectionStatus.ACCEPTED) {
                    return ResponseEntity.ok(Map.of("message", "Already friends", "status", "ACCEPTED", "isMatch", true));
                } else if (connection.getStatus() == FriendConnection.ConnectionStatus.PENDING) {
                    // Check if this is a mutual match (other user already sent a request)
                    // If requester is the receiver in the existing connection, it means the other user sent first
                    if (connection.getReceiver().getId().equals(requesterId)) {
                        // Mutual match! Both users clicked yes
                        connection.setStatus(FriendConnection.ConnectionStatus.ACCEPTED);
                        friendConnectionRepository.save(connection);
                        return ResponseEntity.ok(Map.of(
                            "message", "It's a match! You're now friends!",
                            "status", "ACCEPTED",
                            "isMatch", true,
                            "connectionId", connection.getId()
                        ));
                    } else {
                        // This user already sent a request
                        return ResponseEntity.ok(Map.of("message", "Friend request already pending", "status", "PENDING", "isMatch", false));
                    }
                } else if (connection.getStatus() == FriendConnection.ConnectionStatus.REJECTED) {
                    // Can't send request if already rejected
                    return ResponseEntity.badRequest().body(Map.of("message", "Cannot send request to a user who was previously rejected", "status", "REJECTED"));
                }
            }

            // Check if there's a pending request from the other direction (mutual match scenario)
            // This handles the case where receiver already sent a request to requester
            Optional<FriendConnection> reverseConnection = 
                friendConnectionRepository.findConnectionBetweenUsers(receiverId, requesterId);
            
            if (reverseConnection.isPresent()) {
                FriendConnection connection = reverseConnection.get();
                if (connection.getStatus() == FriendConnection.ConnectionStatus.PENDING && 
                    connection.getRequester().getId().equals(receiverId)) {
                    // Mutual match! Both users clicked yes
                    connection.setStatus(FriendConnection.ConnectionStatus.ACCEPTED);
                    friendConnectionRepository.save(connection);
                    return ResponseEntity.ok(Map.of(
                        "message", "It's a match! You're now friends!",
                        "status", "ACCEPTED",
                        "isMatch", true,
                        "connectionId", connection.getId()
                    ));
                }
            }

            // Create new friend request
            FriendConnection friendRequest = new FriendConnection();
            friendRequest.setRequester(requester);
            friendRequest.setReceiver(receiver);
            friendRequest.setStatus(FriendConnection.ConnectionStatus.PENDING);

            friendConnectionRepository.save(friendRequest);

            return ResponseEntity.ok(Map.of(
                "message", "Friend request sent successfully",
                "status", "PENDING",
                "isMatch", false,
                "connectionId", friendRequest.getId()
            ));
        } catch (Exception e) {
            System.err.println("Error sending friend request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Reject friend request or skip user (No - I don't want to be friends)
     */
    @PostMapping("/matchmaking/reject-friend-request")
    public ResponseEntity<Map<String, Object>> rejectFriendRequest(
            @RequestBody Map<String, Long> request) {
        try {
            Long requesterId = request.get("requesterId");
            Long receiverId = request.get("receiverId");

            if (requesterId == null || receiverId == null) {
                return ResponseEntity.badRequest().build();
            }

            // Check if connection exists
            Optional<FriendConnection> existingConnection = 
                friendConnectionRepository.findConnectionBetweenUsers(requesterId, receiverId);

            if (existingConnection.isPresent()) {
                FriendConnection connection = existingConnection.get();
                connection.setStatus(FriendConnection.ConnectionStatus.REJECTED);
                friendConnectionRepository.save(connection);
                return ResponseEntity.ok(Map.of("message", "Friend request rejected", "status", "REJECTED"));
            } else {
                // Create a rejected connection to remember this decision
                User requester = userRepository.findById(requesterId).orElse(null);
                User receiver = userRepository.findById(receiverId).orElse(null);

                if (requester == null || receiver == null) {
                    return ResponseEntity.notFound().build();
                }

                FriendConnection rejectedConnection = new FriendConnection();
                rejectedConnection.setRequester(requester);
                rejectedConnection.setReceiver(receiver);
                rejectedConnection.setStatus(FriendConnection.ConnectionStatus.REJECTED);
                friendConnectionRepository.save(rejectedConnection);

                return ResponseEntity.ok(Map.of("message", "User skipped", "status", "REJECTED"));
            }
        } catch (Exception e) {
            System.err.println("Error rejecting friend request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all matches (friends) for a user
     */
    @GetMapping("/matchmaking/friends/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getFriends(@PathVariable Long userId) {
        try {
            // Get current user with interests loaded
            User currentUser = userRepository.findAllWithInterests().stream()
                    .filter(user -> user.getId().equals(userId))
                    .findFirst()
                    .orElse(null);
            
            if (currentUser == null || currentUser.getProfile() == null) {
                return ResponseEntity.notFound().build();
            }

            Profile currentProfile = currentUser.getProfile();
            List<FriendConnection> acceptedConnections = 
                friendConnectionRepository.findAcceptedConnectionsForUser(userId);

            List<Map<String, Object>> friends = new ArrayList<>();
            Set<Long> currentUserInterestIds = currentUser.getInterests().stream()
                    .map(Interest::getId)
                    .collect(Collectors.toSet());

            for (FriendConnection connection : acceptedConnections) {
                User friend = connection.getRequester().getId().equals(userId) 
                    ? connection.getReceiver() 
                    : connection.getRequester();

                // Eagerly load friend's interests
                User friendWithInterests = userRepository.findAllWithInterests().stream()
                        .filter(u -> u.getId().equals(friend.getId()))
                        .findFirst()
                        .orElse(friend);

                Map<String, Object> friendData = new HashMap<>();
                friendData.put("userId", friendWithInterests.getId());
                friendData.put("email", friendWithInterests.getEmail());
                
                // Build profile data without circular references
                if (friendWithInterests.getProfile() != null) {
                    Profile profile = friendWithInterests.getProfile();
                    Map<String, Object> profileMap = new HashMap<>();
                    profileMap.put("id", profile.getId());
                    profileMap.put("firstName", profile.getFirstName());
                    profileMap.put("lastName", profile.getLastName());
                    profileMap.put("age", profile.getAge());
                    profileMap.put("photo", profile.getPhoto());
                    profileMap.put("bio", profile.getBio());
                    profileMap.put("travelStyle", profile.getTravelStyle());
                    profileMap.put("languages", profile.getLanguages());
                    if (profile.getLocation() != null) {
                        Map<String, Object> locationData = new HashMap<>();
                        locationData.put("id", profile.getLocation().getId());
                        locationData.put("city", profile.getLocation().getCity());
                        locationData.put("state", profile.getLocation().getState());
                        locationData.put("country", profile.getLocation().getCountry());
                        locationData.put("latitude", profile.getLocation().getLatitude());
                        locationData.put("longitude", profile.getLocation().getLongitude());
                        profileMap.put("location", locationData);
                    }
                    friendData.put("profile", profileMap);
                }
                
                // Build interests data without circular references
                List<Map<String, Object>> interestsData = friendWithInterests.getInterests().stream()
                        .map(interest -> {
                            Map<String, Object> interestData = new HashMap<>();
                            interestData.put("id", interest.getId());
                            interestData.put("name", interest.getName());
                            return interestData;
                        })
                        .collect(Collectors.toList());
                friendData.put("interests", interestsData);

                // Calculate similarities for display
                List<String> similarities = new ArrayList<>();
                if (friendWithInterests.getProfile() != null) {
                    Profile friendProfile = friendWithInterests.getProfile();
                    
                    // Shared interests
                    Set<Long> friendInterestIds = friendWithInterests.getInterests().stream()
                            .map(Interest::getId)
                            .collect(Collectors.toSet());
                    friendInterestIds.retainAll(currentUserInterestIds);
                    if (!friendInterestIds.isEmpty()) {
                        List<String> sharedInterestNames = friendWithInterests.getInterests().stream()
                                .filter(interest -> friendInterestIds.contains(interest.getId()))
                                .map(Interest::getName)
                                .collect(Collectors.toList());
                        similarities.add("Shared interests: " + String.join(", ", sharedInterestNames));
                    }
                    
                    // Similar age
                    if (currentProfile.getAge() != null && friendProfile.getAge() != null) {
                        long ageDiff = Math.abs(currentProfile.getAge() - friendProfile.getAge());
                        if (ageDiff <= 5) {
                            similarities.add("Similar age");
                        }
                    }
                }
                friendData.put("similarities", similarities);
                
                friends.add(friendData);
            }

            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            System.err.println("Error fetching friends: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

