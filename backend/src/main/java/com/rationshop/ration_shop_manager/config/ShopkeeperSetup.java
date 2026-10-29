package com.rationshop.ration_shop_manager.config;

import com.rationshop.ration_shop_manager.model.Shopkeeper;
import com.rationshop.ration_shop_manager.repository.ShopkeeperRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class ShopkeeperSetup {

    @Bean
    CommandLineRunner createShopkeeper(
            ShopkeeperRepository repository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (repository.findByUsername("shopkeeper").isEmpty()) {
                Shopkeeper shopkeeper = new Shopkeeper();

                shopkeeper.setUsername("shopkeeper");
                shopkeeper.setPasswordHash(
                        passwordEncoder.encode("ChangeMe123!")
                );

                repository.save(shopkeeper);
                System.out.println("Initial shopkeeper account created.");
            }
        };
    }
}
