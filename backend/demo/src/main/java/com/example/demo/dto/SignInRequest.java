package com.example.demo.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class SignInRequest {
    @Email @NotBlank
    private String email;

    @NotBlank
    private String password;
}