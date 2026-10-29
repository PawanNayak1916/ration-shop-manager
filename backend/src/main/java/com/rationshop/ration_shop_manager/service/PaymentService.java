package com.rationshop.ration_shop_manager.service;

import com.rationshop.ration_shop_manager.model.Payment;
import com.rationshop.ration_shop_manager.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository){
        this.paymentRepository = paymentRepository;
    }

    public Payment addPayment(Payment payment){
        if(payment.getPaymentDate() == null){
            payment.setPaymentDate(LocalDate.now());
        }
        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments(){
        return paymentRepository.findAll();
    }
}
