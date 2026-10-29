package com.rationshop.ration_shop_manager.repository;

import com.rationshop.ration_shop_manager.model.Shopkeeper;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShopkeeperRepository extends JpaRepository<Shopkeeper, Long> {
    Optional<Shopkeeper> findByUsername(String username);
}
