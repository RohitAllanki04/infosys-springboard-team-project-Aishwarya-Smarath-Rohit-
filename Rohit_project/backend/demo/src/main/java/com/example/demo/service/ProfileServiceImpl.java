package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.Repo.ProfileRepository;
import com.example.demo.service.ProfileService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileServiceImpl(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Override
    public List<User> getAllProfilesUser() {
        return profileRepository.findByRole(User.Role.USER);
    }
    @Override
    public List<User> getAllProfilesManager() {
        return profileRepository.findByRole(User.Role.STORE_MANAGER);
    }

    @Override
    public List<User> getAllProfile()
    {
        return profileRepository.findAll();
    }

    @Override
    public User getProfileById(Long id) {
        return profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Profile not found with ID: " + id));
    }

    @Override
    public User updateProfile(Long id, User updatedProfile) {
        User existingProfile = getProfileById(id);
        existingProfile.setFullName(updatedProfile.getFullName());
        existingProfile.setEmail(updatedProfile.getEmail());
        existingProfile.setPassword(updatedProfile.getPassword());
        existingProfile.setRole(updatedProfile.getRole());
        existingProfile.setCompanyName(updatedProfile.getCompanyName());
        existingProfile.setContactNumber(updatedProfile.getContactNumber());
        existingProfile.setWarehouseLocation(updatedProfile.getWarehouseLocation());
        return profileRepository.save(existingProfile);
    }

    @Override
    public void deleteProfile(Long id) {
        profileRepository.deleteById(id);
    }
}
