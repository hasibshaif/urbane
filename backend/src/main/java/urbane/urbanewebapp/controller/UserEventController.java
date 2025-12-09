package urbane.urbanewebapp.controller;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.relational.core.sql.TrueCondition;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import urbane.urbanewebapp.dto.request.JoinUserEventRequestDTO;
import urbane.urbanewebapp.dto.response.UserEventDTO;
import urbane.urbanewebapp.model.Event;
import urbane.urbanewebapp.model.Profile;
import urbane.urbanewebapp.model.User;
import urbane.urbanewebapp.model.UserEvent;
import urbane.urbanewebapp.repository.EventRepository;
import urbane.urbanewebapp.repository.UserEventRepository;
import urbane.urbanewebapp.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class UserEventController {

    @Autowired
    UserEventRepository userEventRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    EventRepository eventRepository;

    @Autowired
    ModelMapper modelMapper;



    //logic user joins an event

    @PostMapping("/JoinUserEvent")
    public ResponseEntity<UserEventDTO> joinUserEvent(@RequestBody JoinUserEventRequestDTO request) {
        User user = userRepository.findById(request.getUserId()).orElseThrow();
        Event event = eventRepository.findById(request.getEventId()).orElseThrow();


        long count = userEventRepository.countByRsvpStatusTrueAndEventId(event.getId());

        if (count >= event.getCapacity()){
            return  ResponseEntity.badRequest().build();
        }

        // join event if not at capacity
        UserEvent userEvent = new UserEvent();
        userEvent.setUser(user);
        userEvent.setEvent(event);
        userEvent.setRsvpStatus(true);
        UserEvent savedUserEvent = userEventRepository.save(userEvent);

        UserEventDTO userEventDTO = modelMapper.map(savedUserEvent, UserEventDTO.class);

        userEventDTO.setUserId(savedUserEvent.getUser().getId());
        userEventDTO.setEventId(savedUserEvent.getEvent().getId());
        userEventDTO.setRsvpStatus(savedUserEvent.isRsvpStatus());
        userEventDTO.setTitle(savedUserEvent.getEvent().getTitle());
        userEventDTO.setDescription(savedUserEvent.getEvent().getDescription());
        userEventDTO.setCity(savedUserEvent.getEvent().getCity());
        userEventDTO.setState(savedUserEvent.getEvent().getState());
        userEventDTO.setCountry(savedUserEvent.getEvent().getCountry());

        return ResponseEntity.ok(userEventDTO);
    }

    @GetMapping("/getAllUsersAttending/{event_id}")
    public ResponseEntity<List<Profile>> getAllUsersAttending(@PathVariable("event_id") long eventId) {

        Event event  = eventRepository.findById(eventId).orElseThrow();
        List<UserEvent> attendees = userEventRepository.findByEventIdAndRsvpStatusTrue(eventId);

        List<Profile> profiles = attendees.stream().
                map(userEvent -> userEvent.getUser().getProfile())
                .collect(Collectors.toList());

        return ResponseEntity.ok(profiles);


        //fetch all users attending an event check if rsvp status == true and return there profile entity
    }

    @GetMapping("/getAllEventsAttending{user_id}")
    public ResponseEntity<List<UserEventDTO>> getAllEventsAttending(@PathVariable("user_id") long userId) {
        User  user = userRepository.findById(userId).orElseThrow();

        List<UserEvent> events = userEventRepository.findByUserIdAndRsvpStatusTrue(userId);

        List<UserEventDTO> dto =  events.stream().
                map(userEvent -> modelMapper.map(userEvent, UserEventDTO.class))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dto);
        // returns userEvent dto, event

    }


    @DeleteMapping("/withdraw/{user_id}/{event_id}")
    public ResponseEntity<HttpStatus> UserWithdraw(@PathVariable("user_id") long userId, @PathVariable("event_id") long eventId) {
        User user = userRepository.findById(userId).orElseThrow();
        Event event = eventRepository.findById(eventId).orElseThrow();

        userEventRepository.deleteUserEventByUserIdAndEventId(userId, eventId);
        return ResponseEntity.ok(HttpStatus.OK);

    }

    //get attendees count
    @GetMapping("/getAttendees/{event_id}")
    public ResponseEntity<Long> countAttendees(@PathVariable("event_id") long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow();
        long count = userEventRepository.countByRsvpStatusTrueAndEventId(eventId);
        return ResponseEntity.ok(count);
    }





    //make get mapping an enumerated type for RSVPstatus

}





