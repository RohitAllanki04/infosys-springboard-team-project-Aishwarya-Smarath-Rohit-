package com.example.demo.service;

import com.example.demo.model.StockTransaction;
import com.example.demo.Repo.StockTransactionRepository;
import com.example.demo.service.StockTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockTransactionServiceImpl implements StockTransactionService {

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Override
    public StockTransaction createTransaction(StockTransaction transaction) {
        return stockTransactionRepository.save(transaction);
    }

    @Override
    public StockTransaction updateTransaction(Long id, StockTransaction updatedTransaction) {

        StockTransaction existing = stockTransactionRepository.findById(id)
                .orElse(null);

        if (existing == null) {
            return null;
        }

        existing.setQuantity(updatedTransaction.getQuantity());
        existing.setType(updatedTransaction.getType());
        existing.setProduct(updatedTransaction.getProduct());
        existing.setVendor(updatedTransaction.getVendor());

        return stockTransactionRepository.save(existing);
    }


    @Override
    public List<StockTransaction> getAllTransactions() {
        return stockTransactionRepository.findAll();
    }

    @Override
    public StockTransaction getTransactionById(Long id) {
        return stockTransactionRepository.findById(id).orElse(null);
    }

    @Override
    public List<StockTransaction> getTransactionsByVendorId(Long vendorId) {
        return stockTransactionRepository.findByVendorId(vendorId);
    }
}
