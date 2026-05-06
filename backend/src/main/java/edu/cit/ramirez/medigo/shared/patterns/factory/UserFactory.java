package edu.cit.ramirez.medigo.shared.patterns.factory;

import edu.cit.ramirez.medigo.features.auth.dto.RegisterRequest;
import edu.cit.ramirez.medigo.features.user.entity.User;

public interface UserFactory {

    User createLocalUser(RegisterRequest request, String encodedPassword);

    User createGoogleUser(String email, String name, String role);
}
