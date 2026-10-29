package com.rationshop.ration_shop_manager.controller;

import com.rationshop.ration_shop_manager.model.Payment;
import com.rationshop.ration_shop_manager.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService){
        this.paymentService = paymentService;
    }
    @PostMapping
    public Payment addPayment(@RequestBody Payment payment){
        return paymentService.addPayment(payment);
    }

    @GetMapping
    public List<Payment> getAllpayments(){
        return paymentService.getAllPayments();
    }
}
