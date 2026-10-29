package com.rationshop.ration_shop_manager.service;

import com.rationshop.ration_shop_manager.model.Supplier;
import com.rationshop.ration_shop_manager.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public Supplier addSupplier(Supplier supplier){
        return supplierRepository.save(supplier);
    }

    public List<Supplier> getAllSuppliers(){
        return supplierRepository.findAll();
    }
}
