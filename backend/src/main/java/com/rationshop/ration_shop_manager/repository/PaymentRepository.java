package com.rationshop.ration_shop_manager.repository;

import com.rationshop.ration_shop_manager.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findBySupplierName(String supplierName);
}
