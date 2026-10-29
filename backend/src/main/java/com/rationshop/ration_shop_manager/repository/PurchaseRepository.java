package com.rationshop.ration_shop_manager.repository;

import com.rationshop.ration_shop_manager.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findBySupplierName(String supplierName);
}
