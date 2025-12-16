package net.java.inventory_app.service;

import net.java.inventory_app.entity.User;
import java.util.List;

public interface UserService {
    
    // Register a new user
    User registerUser(User user);
    
    // Login user
    User loginUser(String email, String password);
    
    // Get all users
    List<User> getAllUsers();
    
    // Get user by ID
    User getUserById(Long id);
    
    // Delete user
    void deleteUser(Long id);
}