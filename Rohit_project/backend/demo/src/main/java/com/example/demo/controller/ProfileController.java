package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    @Autowired
    private ProfileService profileService;
    //disaply like vendor ,warehouse manager for admin
    @GetMapping("/User")
    public List<User> getAllProfilesUser() {
        return profileService.getAllProfilesUser();
    }
    @GetMapping("/")
    public List<User> getAllProfiles()
    {
        return profileService.getAllProfile();
    }
    @GetMapping("/Manager")
    public List<User> getAllProfilesManager() {
        return profileService.getAllProfilesManager();
    }
   //dispaly the profile details
    @GetMapping("/{id}")
    public User getProfileById(@PathVariable Long id) {
        return profileService.getProfileById(id);
    }

    // edit profile details
    @PutMapping("/{id}")
    public User updateProfile(@PathVariable Long id, @RequestBody User profile) {
        return profileService.updateProfile(id, profile);
    }
// delete the profile
    @DeleteMapping("/{id}")
    public String deleteProfile(@PathVariable Long id) {
        profileService.deleteProfile(id);
        return "Profile deleted successfully";
    }
}
