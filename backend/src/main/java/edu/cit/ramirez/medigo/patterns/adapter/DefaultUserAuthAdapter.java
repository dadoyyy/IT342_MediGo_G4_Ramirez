package edu.cit.ramirez.medigo.patterns.adapter;

import edu.cit.ramirez.medigo.dto.AuthResponse;
import edu.cit.ramirez.medigo.dto.UserDto;
import edu.cit.ramirez.medigo.entity.User;
import org.springframework.stereotype.Component;

@Component
public class DefaultUserAuthAdapter implements UserAuthAdapter {

    @Override
    public UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    public AuthResponse toAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(toUserDto(user))
                .build();
    }
}
