package urbane.urbanewebapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "locations")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "location_id")
    private Long id;

    //holder of the ID

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL)
    private List<Profile> profiles;

    private String country;

    private String city;

    private String state;

    private String latitude;
    private String longitude;


}
