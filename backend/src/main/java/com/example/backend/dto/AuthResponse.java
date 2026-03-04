package com.example.backend.dto;

import lombok.*;

/**
 * Data returned by both /register and /login endpoints.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String tokenType;
    private UserDto user;
}
