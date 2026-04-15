package edu.cit.ramirez.medigo.patterns.factory;

import edu.cit.ramirez.medigo.dto.RegisterRequest;
import edu.cit.ramirez.medigo.entity.User;

public interface UserFactory {

    User createLocalUser(RegisterRequest request, String encodedPassword);

    User createGoogleUser(String email, String name, String role);
}
