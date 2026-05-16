package edu.cit.ramirez.medigo.features.user;

import edu.cit.ramirez.medigo.features.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByVerificationToken(String token);

    boolean existsByEmail(String email);

    long countByRole(String role);

    java.util.List<User> findByRoleOrderByIdDesc(String role);
}
