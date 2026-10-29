package com.rationshop.ration_shop_manager.service;

import com.rationshop.ration_shop_manager.model.Shopkeeper;
import com.rationshop.ration_shop_manager.repository.ShopkeeperRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class ShopkeeperService {
    private final ShopkeeperRepository repository;
    private final PasswordEncoder passwordEncoder;

    public ShopkeeperService(
            ShopkeeperRepository repository,
            PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean login(String username, String password){
        return repository.findByUsername(username)
                .map(shopkeeper ->
                        passwordEncoder.matches(
                                password,
                                shopkeeper.getPasswordHash()
                        ))
                .orElse(false);
    }
    public void createAccount(String username, String password){
        if(repository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException(
                    "Username already Exists"
            );
        }
            Shopkeeper shopkeeper = new Shopkeeper();
            shopkeeper.setUsername(username);
            shopkeeper.setPasswordHash(
                    passwordEncoder.encode(password));
            repository.save(shopkeeper);

    }
}
