package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String password; // nullable for oauth-only users

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column
    private String contactNumber;

    @Column
    private String warehouseLocation;

    @Column
    private boolean usingOauth; // true if created via Google OAuth

    public enum Role {
        ADMIN,
        STORE_MANAGER,
        USER
    }


}
