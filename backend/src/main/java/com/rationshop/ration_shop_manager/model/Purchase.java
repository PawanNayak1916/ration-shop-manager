package com.rationshop.ration_shop_manager.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="purchases")
public class Purchase {
    @Setter
    @Getter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Setter
    @Getter
    private String supplierName;
    @Setter
    @Getter
    private LocalDate purchaseDate;
    @Setter
    @Getter
    private double totalAmount;


    public Purchase(){

    }
    @Getter
    @Setter
    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "purchase_id")
    private List<PurchaseItem> items = new ArrayList<>();

    public void calculateTotalAmount() {

        double total = 0;

        for (PurchaseItem item : items) {
            item.calculateTotalPrice();
            total = total + item.getTotalPrice();
        }

        this.totalAmount = total;
    }

}
