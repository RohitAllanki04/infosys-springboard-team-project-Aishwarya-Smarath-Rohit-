package com.example.demo.service;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.SignInRequest;
import com.example.demo.dto.SignUpRequest;
import com.example.demo.model.User;

public interface UserService {

    AuthResponse signIn(SignInRequest req);

    AuthResponse signUp(SignUpRequest req);

    User findByEmail(String email);
}
