package com.example.demo.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class SignUpRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    @NotBlank(message = "Role is required")
    private String role; // ADMIN or STORE_MANAGER or USER

    private String contactNumber;
    private String warehouseLocation;
}
