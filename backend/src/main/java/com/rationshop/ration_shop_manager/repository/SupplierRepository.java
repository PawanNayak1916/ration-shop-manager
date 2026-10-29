package com.rationshop.ration_shop_manager.repository;

import com.rationshop.ration_shop_manager.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
}
