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
import java.util.Collections;
import java.util.List;

@RestController
public class EventController {

    @Autowired
    EventRepository eventRepository;

    @Autowired
    UserRepository userRepository;

    // Get all events
    @GetMapping("/getAllEvents")
    public ResponseEntity<List<Event>> getAllEvents() {
        List<Event> allEvents = eventRepository.findAll();
        return ResponseEntity.ok(allEvents);
    }

    //save the event
    @PostMapping("/saveEvent")
    public ResponseEntity<Event> saveEvent(@RequestBody CreateEventRequestDTO request) {
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
            return ResponseEntity.ok(savedEvent);
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error saving event: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getEventByState/{state}")
    public ResponseEntity<List<Event>> getEventByState(@PathVariable String state) {
        List<Event> savedEvents  = eventRepository.findEventsByState(state);

        // Return empty list instead of 404 when no events found
        return ResponseEntity.ok(savedEvents);
    }
    //get event by city and state
    @GetMapping("/getEventByStateCity/{state}/{city}")
    public ResponseEntity<List<Event>> getEventByStateCity(@PathVariable String state, @PathVariable String city) {
        List<Event> existingEvents  = eventRepository.findEventsByStateAndCity(state, city);

        // Return empty list instead of 404 when no events found
        return ResponseEntity.ok(existingEvents);

    }

    //fetch event by id
    @GetMapping("/getEventById/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        Event existingEvents = eventRepository.findById(id).orElse(null);
        if (existingEvents == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(existingEvents);

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








