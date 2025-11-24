package urbane.urbanewebapp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
public class User {
    //primary key
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    //holder of the primary key (is also a foreign key as the same id maps to a profile)
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonManagedReference
    private Profile profile;

    @OneToMany(mappedBy = "user",  cascade = CascadeType.ALL)
    @JsonIgnore
    private List<UserEvent> events = new ArrayList<>();


    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    private String email;


    @NotBlank
    @Column(unique = true, nullable = false, length = 20)
    private String password;





}
