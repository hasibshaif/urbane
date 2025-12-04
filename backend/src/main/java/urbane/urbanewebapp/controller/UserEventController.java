package urbane.urbanewebapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;
import urbane.urbanewebapp.repository.EventRepository;
import urbane.urbanewebapp.repository.UserEventRepository;
import urbane.urbanewebapp.repository.UserRepository;

@RestController
public class UserEventController {

    @Autowired
    UserEventRepository userEventRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    EventRepository eventRepository;

    //logic user joins an event



}
