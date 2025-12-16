package com.example.demo.service;

import com.example.demo.model.Cart;
import com.example.demo.model.Product;
import com.example.demo.model.User;
import com.example.demo.Repo.CartRepository;
import com.example.demo.Repo.ProductRepository;
import com.example.demo.Repo.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    public Cart addToCart(Long userId, Long productId) {
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);

        if (user == null || product == null) return null;

        Cart existing = cartRepository.findByUserAndProduct(user, product);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + 1);
            return cartRepository.save(existing);
        }

        Cart item = new Cart();
        item.setUser(user);
        item.setProduct(product);
        item.setQuantity(1);
        return cartRepository.save(item);
    }

    @Override
    public Cart increaseQty(Long userId, Long productId) {
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);

        if (user == null || product == null) return null;

        Cart cartItem = cartRepository.findByUserAndProduct(user, product);

        if (cartItem == null) {
            cartItem = new Cart();
            cartItem.setUser(user);
            cartItem.setProduct(product);
            cartItem.setQuantity(1);
            return cartRepository.save(cartItem);
        }

        cartItem.setQuantity(cartItem.getQuantity() + 1);
        return cartRepository.save(cartItem);
    }

    @Override
    public Cart decreaseQty(Long userId, Long productId) {
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);

        if (user == null || product == null) return null;

        Cart cartItem = cartRepository.findByUserAndProduct(user, product);

        if (cartItem == null) return null;

        int newQty = cartItem.getQuantity() - 1;

        if (newQty <= 0) {
            cartRepository.delete(cartItem);
            return null;
        }

        cartItem.setQuantity(newQty);
        return cartRepository.save(cartItem);
    }

    @Override
    public Cart updateCart(Long userId, Long productId, Integer qty) {
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);

        if (user == null || product == null) return null;

        Cart cartItem = cartRepository.findByUserAndProduct(user, product);

        if (cartItem == null) return null;

        if (qty <= 0) {
            cartRepository.delete(cartItem);
            return null;
        }

        cartItem.setQuantity(qty);
        return cartRepository.save(cartItem);
    }

    @Override
    public void removeFromCart(Long userId, Long productId) {
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);

        if (user == null || product == null) return;

        Cart existing = cartRepository.findByUserAndProduct(user, product);

        if (existing != null) {
            cartRepository.delete(existing);
        }
    }

    @Override
    public List<Cart> getCart(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;

        return cartRepository.findByUser(user);
    }
}
