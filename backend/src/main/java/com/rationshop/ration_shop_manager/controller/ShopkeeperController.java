package com.rationshop.ration_shop_manager.controller;

import com.rationshop.ration_shop_manager.service.ShopkeeperService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class ShopkeeperController {
    private final ShopkeeperService shopkeeperService;

    public ShopkeeperController(ShopkeeperService shopkeeperService){
        this.shopkeeperService = shopkeeperService;
    }


    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @RequestBody LoginRequest request){
        boolean success = shopkeeperService.login(
                request.username(),
                request.password()
        );
        if(!success){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        }
        return ResponseEntity.ok(
                Map.of("message", "Login successful")
        );
    }
    public record LoginRequest(String username, String password){

    }
}
