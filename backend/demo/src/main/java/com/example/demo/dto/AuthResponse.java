package com.example.demo.dto;

import com.example.demo.model.User.Role; // ✅ import your Role enum
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private Role role; // ✅ use the Role type, not enum declaration
    private Long id;
}
