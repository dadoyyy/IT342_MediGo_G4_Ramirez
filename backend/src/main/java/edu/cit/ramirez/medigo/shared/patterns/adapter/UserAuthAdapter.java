package edu.cit.ramirez.medigo.shared.patterns.adapter;

import edu.cit.ramirez.medigo.features.auth.dto.AuthResponse;
import edu.cit.ramirez.medigo.features.user.dto.UserDto;
import edu.cit.ramirez.medigo.features.user.entity.User;

public interface UserAuthAdapter {

    UserDto toUserDto(User user);

    AuthResponse toAuthResponse(User user, String token);
}
