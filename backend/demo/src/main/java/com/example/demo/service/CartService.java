package com.example.demo.service;

import com.example.demo.model.Cart;

import java.util.List;

public interface CartService {

    Cart addToCart(Long userId, Long productId);

    Cart increaseQty(Long userId, Long productId);

    Cart decreaseQty(Long userId, Long productId);

    Cart updateCart(Long userId, Long productId, Integer qty);

    void removeFromCart(Long userId, Long productId);

    List<Cart> getCart(Long userId);
}
