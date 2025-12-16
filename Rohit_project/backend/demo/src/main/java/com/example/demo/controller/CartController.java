package com.example.demo.controller;

import com.example.demo.model.Cart;
import com.example.demo.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @PostMapping("/add")
    public Cart addToCart(
            @PathVariable Long userId,
            @PathVariable Long productId) {

        return cartService.addToCart(userId, productId);
    }

    @PostMapping("/increase")
    public Cart increase(
            @PathVariable Long userId,
            @PathVariable Long productId) {

        return cartService.increaseQty(userId, productId);
    }

    @PostMapping("/decrease")
    public Cart decrease(
            @PathVariable Long userId,
            @PathVariable Long productId) {

        return cartService.decreaseQty(userId, productId);
    }

    @PutMapping("/update")
    public Cart updateQty(
            @PathVariable Long userId,
            @PathVariable Long productId,
            @PathVariable Integer qty) {

        return cartService.updateCart(userId, productId, qty);
    }

    @DeleteMapping("/remove")
    public String removeItem(
            @PathVariable Long userId,
            @PathVariable Long productId) {

        cartService.removeFromCart(userId, productId);
        return "Removed";
    }

    @GetMapping("/items")
    public List<Cart> getItems(@PathVariable Long userId) {
        return cartService.getCart(userId);
    }
}
