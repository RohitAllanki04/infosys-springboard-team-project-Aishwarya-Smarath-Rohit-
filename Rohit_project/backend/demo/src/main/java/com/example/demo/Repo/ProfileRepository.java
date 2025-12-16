package com.example.demo.Repo;
import java.util.List;

import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProfileRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email); // optional check to prevent duplicates
    List<User> findByRole(User.Role role);
}
