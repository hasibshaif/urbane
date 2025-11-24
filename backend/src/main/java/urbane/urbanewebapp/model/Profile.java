package urbane.urbanewebapp.model;


import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonBackReference
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    //many users can have one/same location --> foreign key
    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    private Long age;
    private String photo;



}
