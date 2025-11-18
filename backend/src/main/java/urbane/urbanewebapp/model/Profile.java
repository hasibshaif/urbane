package urbane.urbanewebapp.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "profiles")
public class Profile {
    //primary key
    @Id
    @Column(name = "user_id")
    private Long Id;

    //primary key and foreign key
    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    //many users can have one/same location --> foreign key
    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;


    private Long Age;
    private String Photo;



}
