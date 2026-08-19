-- Database Schema for OTP-Based User Recognition & Checkout Application

CREATE DATABASE IF NOT EXISTS otp_checkout_db;
USE otp_checkout_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    otp_expires_at DATETIME NOT NULL,
    otp_attempts INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- 2. Checkout Orders Table
CREATE TABLE IF NOT EXISTS checkout_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_reference VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_ref (order_reference),
    INDEX idx_order_email (email)
);

