package com.rationshop.ration_shop_manager.service;

import com.rationshop.ration_shop_manager.model.Payment;
import com.rationshop.ration_shop_manager.model.Purchase;
import com.rationshop.ration_shop_manager.repository.PaymentRepository;
import com.rationshop.ration_shop_manager.repository.PurchaseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DueService {

    private final PurchaseRepository purchaseRepository;
    private final PaymentRepository paymentRepository;

    public DueService(PurchaseRepository purchaseRepository, PaymentRepository paymentRepository){
        this.purchaseRepository = purchaseRepository;
        this.paymentRepository = paymentRepository;
    }

    public double calculateDue(String supplierName){
        List<Purchase> purchases = purchaseRepository.findBySupplierName(supplierName);
        List<Payment> payments = paymentRepository.findBySupplierName(supplierName);

        System.out.println("Supplier: " + supplierName);
        System.out.println("Purchases found: " + purchases.size());
        System.out.println("Payments found: " + payments.size());

        double totalPurchase = 0;
        for(Purchase purchase : purchases){
            System.out.println("Purchase amount: " + purchase.getTotalAmount());
            totalPurchase = totalPurchase + purchase.getTotalAmount();
        }
        double totalPayment = 0;
        for(Payment payment : payments){
            System.out.println("Payment amount: " + payment.getAmount());
            totalPayment = totalPayment + payment.getAmount();
        }
        System.out.println("Total Purchase: " + totalPurchase);
        System.out.println("Total Payment: " + totalPayment);

        return totalPurchase - totalPayment;
    }
}
