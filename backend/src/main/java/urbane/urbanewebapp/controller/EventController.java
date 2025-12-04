package urbane.urbanewebapp.controller;

import jakarta.validation.constraints.Null;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import urbane.urbanewebapp.model.Event;
import urbane.urbanewebapp.repository.EventRepository;

import javax.swing.plaf.nimbus.State;
import java.util.Collections;
import java.util.List;

@RestController
public class EventController {

    @Autowired
    EventRepository eventRepository;

    //save the event
    @PostMapping("/saveEvent")
    public Event saveEvent(@RequestBody Event event) {
        return eventRepository.save(event);

    }

    @GetMapping("/getEventByState/{state}")
    public ResponseEntity<List<Event>> getEventByState(@PathVariable String state) {
        List<Event> savedEvents  = eventRepository.findEventsByState(state);

        if (savedEvents.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(savedEvents);
    }
    //get event by city and state
    @GetMapping("/getEventByStateCity/{state}/{city}")
    public ResponseEntity<List<Event>> getEventByStateCity(@PathVariable String state, @PathVariable String city) {
        List<Event> existingEvents  = eventRepository.findEventsByStateAndCity(state, city);

        if (existingEvents.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
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








