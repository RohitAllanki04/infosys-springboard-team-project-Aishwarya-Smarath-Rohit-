package com.example.demo.Security;

import com.example.demo.model.User.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final Key secretKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private final long expirationMillis = 24 * 60 * 60 * 1000;

    public String generateToken(Long id, String email, Role role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("id", id)
                .claim("role", role.name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(secretKey)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return parseToken(token).getBody().getSubject();
    }

    public String getRoleFromToken(String token) {
        return parseToken(token).getBody().get("role", String.class);
    }

    public Long getIdFromToken(String token) {
        return parseToken(token).getBody().get("id", Long.class);
    }

    // ✅ ADD THIS (controller expects extractUserId())
    public Long extractUserId(String token) {
        return getIdFromToken(token);
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Jws<Claims> parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token);
    }
}
