package urbane.urbanewebapp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private Profile profile;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    private String email;


    @NotBlank
    @Column(unique = true, nullable = false, length = 20)
    private String password;



}
