package com.example.demo.service;

import com.example.demo.model.User;
import java.util.List;

public interface ProfileService {
    List<User> getAllProfilesUser();
    List<User> getAllProfilesManager();
    List<User> getAllProfile();
    User getProfileById(Long id);
    User updateProfile(Long id, User profile);
    void deleteProfile(Long id);
}
