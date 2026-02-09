package com.learnstream.auth;

import com.learnstream.auth.dto.AuthResponse;
import com.learnstream.auth.dto.LoginRequest;
import com.learnstream.auth.dto.RefreshRequest;
import com.learnstream.auth.dto.RegisterRequest;
import com.learnstream.auth.exception.EmailAlreadyExistsException;
import com.learnstream.auth.exception.InvalidCredentialsException;
import com.learnstream.auth.exception.InvalidTokenException;
import com.learnstream.user.User;
import com.learnstream.user.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        return new AuthResponse(
                jwtService.generateAccessToken(user),
                jwtService.generateRefreshToken(user)
        );
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        return new AuthResponse(
                jwtService.generateAccessToken(user),
                jwtService.generateRefreshToken(user)
        );
    }

    public AuthResponse refresh(RefreshRequest request) {
        Claims claims;
        try {
            claims = jwtService.validateToken(request.refreshToken());
        } catch (JwtException e) {
            throw new InvalidTokenException();
        }

        UUID userId = UUID.fromString(claims.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(InvalidTokenException::new);

        return new AuthResponse(
                jwtService.generateAccessToken(user),
                null
        );
    }
}
