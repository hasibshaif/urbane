package urbane.urbanewebapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //primary key
    @Column(name = "event_id")
    private Long id;

    @Column(unique = true, length = 25)
    private String title;

    @Column(length = 50)
    private String description;


    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    private List<UserEvent> userEvents = new ArrayList<>();


    private Long capacity;



    private String date;

    private String state;
    private String country;
    private String city;
    private String latitude;
    private String longitude;

}
