package urbane.urbanewebapp.controller;

import jakarta.validation.constraints.Null;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import urbane.urbanewebapp.dto.request.CreateEventRequestDTO;
import urbane.urbanewebapp.model.Event;
import urbane.urbanewebapp.model.User;
import urbane.urbanewebapp.repository.EventRepository;
import urbane.urbanewebapp.repository.UserRepository;

import javax.swing.plaf.nimbus.State;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class EventController {

    @Autowired
    EventRepository eventRepository;

    @Autowired
    UserRepository userRepository;

    // Get all events
    @GetMapping("/getAllEvents")
    public ResponseEntity<List<Map<String, Object>>> getAllEvents() {
        List<Event> allEvents = eventRepository.findAll();
        List<Map<String, Object>> eventsData = new ArrayList<>();
        
        for (Event event : allEvents) {
            Map<String, Object> eventData = buildEventMap(event);
            eventsData.add(eventData);
        }
        
        return ResponseEntity.ok(eventsData);
    }
    
    // Helper method to build event map without circular references
    private Map<String, Object> buildEventMap(Event event) {
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("id", event.getId());
        eventData.put("title", event.getTitle());
        eventData.put("description", event.getDescription());
        eventData.put("capacity", event.getCapacity());
        eventData.put("date", event.getDate());
        eventData.put("state", event.getState());
        eventData.put("country", event.getCountry());
        eventData.put("city", event.getCity());
        eventData.put("latitude", event.getLatitude());
        eventData.put("longitude", event.getLongitude());
        
        // Build creator data without circular references
        if (event.getCreator() != null) {
            Map<String, Object> creatorData = new HashMap<>();
            creatorData.put("id", event.getCreator().getId());
            creatorData.put("email", event.getCreator().getEmail());
            
            // Build profile data if it exists
            if (event.getCreator().getProfile() != null) {
                Map<String, Object> profileData = new HashMap<>();
                profileData.put("id", event.getCreator().getProfile().getId());
                profileData.put("firstName", event.getCreator().getProfile().getFirstName());
                profileData.put("lastName", event.getCreator().getProfile().getLastName());
                profileData.put("age", event.getCreator().getProfile().getAge());
                profileData.put("photo", event.getCreator().getProfile().getPhoto());
                profileData.put("bio", event.getCreator().getProfile().getBio());
                profileData.put("travelStyle", event.getCreator().getProfile().getTravelStyle());
                profileData.put("languages", event.getCreator().getProfile().getLanguages());
                if (event.getCreator().getProfile().getLocation() != null) {
                    Map<String, Object> locationData = new HashMap<>();
                    locationData.put("id", event.getCreator().getProfile().getLocation().getId());
                    locationData.put("city", event.getCreator().getProfile().getLocation().getCity());
                    locationData.put("state", event.getCreator().getProfile().getLocation().getState());
                    locationData.put("country", event.getCreator().getProfile().getLocation().getCountry());
                    locationData.put("latitude", event.getCreator().getProfile().getLocation().getLatitude());
                    locationData.put("longitude", event.getCreator().getProfile().getLocation().getLongitude());
                    profileData.put("location", locationData);
                }
                creatorData.put("profile", profileData);
            }
            
            eventData.put("creator", creatorData);
        }
        
        return eventData;
    }

    //save the event
    @PostMapping("/saveEvent")
    public ResponseEntity<Map<String, Object>> saveEvent(@RequestBody CreateEventRequestDTO request) {
        try {
            // Validate title length (max 25 characters)
            if (request.getTitle() != null && request.getTitle().length() > 25) {
                return ResponseEntity.badRequest().build();
            }
            // Validate description length (max 50 characters)
            if (request.getDescription() != null && request.getDescription().length() > 50) {
                return ResponseEntity.badRequest().build();
            }
            
            Event event = new Event();
            event.setTitle(request.getTitle());
            event.setDescription(request.getDescription());
            event.setCapacity(request.getCapacity());
            event.setDate(request.getDate());
            event.setState(request.getState());
            event.setCountry(request.getCountry());
            event.setCity(request.getCity());
            event.setLatitude(request.getLatitude());
            event.setLongitude(request.getLongitude());
            
            // Set creator if creatorId is provided
            if (request.getCreatorId() != null) {
                User creator = userRepository.findById(request.getCreatorId()).orElse(null);
                if (creator != null) {
                    event.setCreator(creator);
                }
            }
            
            Event savedEvent = eventRepository.save(event);
            Map<String, Object> eventData = buildEventMap(savedEvent);
            return ResponseEntity.ok(eventData);
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error saving event: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getEventByState/{state}")
    public ResponseEntity<List<Map<String, Object>>> getEventByState(@PathVariable String state) {
        List<Event> savedEvents = eventRepository.findEventsByState(state);
        List<Map<String, Object>> eventsData = new ArrayList<>();
        
        for (Event event : savedEvents) {
            eventsData.add(buildEventMap(event));
        }
        
        return ResponseEntity.ok(eventsData);
    }
    
    //get event by city and state
    @GetMapping("/getEventByStateCity/{state}/{city}")
    public ResponseEntity<List<Map<String, Object>>> getEventByStateCity(@PathVariable String state, @PathVariable String city) {
        List<Event> existingEvents = eventRepository.findEventsByStateAndCity(state, city);
        List<Map<String, Object>> eventsData = new ArrayList<>();
        
        for (Event event : existingEvents) {
            eventsData.add(buildEventMap(event));
        }
        
        return ResponseEntity.ok(eventsData);
    }

    //fetch event by id
    @GetMapping("/getEventById/{id}")
    public ResponseEntity<Map<String, Object>> getEventById(@PathVariable Long id) {
        Event existingEvent = eventRepository.findById(id).orElse(null);
        if (existingEvent == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(buildEventMap(existingEvent));
    }

    //update event
    @PutMapping("/updateEvent/{id}")
    public ResponseEntity<Event> updateEvent(@RequestBody Event event, @PathVariable long id) {
        Event existingEvent = eventRepository.findById(id).orElse(null);
        if (existingEvent == null) {
            return ResponseEntity.notFound().build();
        }
        existingEvent.setDescription(event.getDescription());
        existingEvent.setState(event.getState());
        existingEvent.setCity(event.getCity());
        existingEvent.setState(event.getState());
        existingEvent.setDate(event.getDate());
        existingEvent.setLatitude(event.getLatitude());
        existingEvent.setLongitude(event.getLongitude());
        existingEvent.setTitle(event.getTitle());
        eventRepository.save(existingEvent);
        return ResponseEntity.ok(existingEvent);
    }


    //delete event
    @DeleteMapping("/deleteEvent/{id}")
    public ResponseEntity<HttpStatus> deleteEvent(@PathVariable long id) {
        Event event = eventRepository.findById(id).orElse(null);
        if (event == null) {
            return ResponseEntity.badRequest().build();
        }
        eventRepository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }






}








