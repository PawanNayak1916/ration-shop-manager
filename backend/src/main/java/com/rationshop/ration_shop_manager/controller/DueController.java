package com.rationshop.ration_shop_manager.controller;

import com.rationshop.ration_shop_manager.service.DueService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/due")
public class DueController {

    private final DueService dueService;

    public DueController(DueService dueService){
        this.dueService = dueService;
    }

    @GetMapping("/{supplierName}")
    public double getDue(@PathVariable String supplierName){
        return dueService.calculateDue(supplierName);
    }
}
