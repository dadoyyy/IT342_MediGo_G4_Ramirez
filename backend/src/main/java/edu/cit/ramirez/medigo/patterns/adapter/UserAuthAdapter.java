package edu.cit.ramirez.medigo.patterns.adapter;

import edu.cit.ramirez.medigo.dto.AuthResponse;
import edu.cit.ramirez.medigo.dto.UserDto;
import edu.cit.ramirez.medigo.entity.User;

public interface UserAuthAdapter {

    UserDto toUserDto(User user);

    AuthResponse toAuthResponse(User user, String token);
}
