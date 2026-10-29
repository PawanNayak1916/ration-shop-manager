package com.rationshop.ration_shop_manager.service;

import com.rationshop.ration_shop_manager.model.Purchase;
import com.rationshop.ration_shop_manager.repository.PurchaseRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class PurchaseService {
    private final PurchaseRepository purchaseRepository;

    public PurchaseService(PurchaseRepository purchaseRepository){
        this.purchaseRepository = purchaseRepository;
    }

    public Purchase addPurchase(Purchase purchase){
        // Agar date nhi di gyi hai to aaj ki date set karo
        if(purchase.getPurchaseDate() == null){
            purchase.setPurchaseDate(LocalDate.now());
        }
        // Items ka total + grand total calculate karo
        purchase.calculateTotalAmount();

        // Database me save karo
        return purchaseRepository.save(purchase);
    }

    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    public void deletePurchase(Long id) {
        purchaseRepository.deleteById(id);
    }
}
