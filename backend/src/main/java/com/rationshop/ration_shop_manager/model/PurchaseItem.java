package com.rationshop.ration_shop_manager.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "purchase_items")
@Setter
@Getter
public class PurchaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String itemName;
    private double pricePerUnit;
    private double quantity;
    private double totalPrice;

    public PurchaseItem(){

    }

    public void calculateTotalPrice(){
        this.totalPrice = this.pricePerUnit * this.quantity;
    }
}
