-- Seed SQL data for OTP-Based User Recognition & Checkout Application

USE otp_checkout_db;

-- Clear existing data if needed (optional)
-- DELETE FROM checkout_orders;
-- DELETE FROM users;

-- Insert sample registered user (Email: john.doe@example.com, OTP: 123456)
INSERT INTO users (email, first_name, last_name, otp_code, otp_expires_at, otp_attempts)
VALUES ('john.doe@example.com', 'John', 'Doe', '123456', DATE_ADD(NOW(), INTERVAL 1 HOUR), 0)
ON DUPLICATE KEY UPDATE first_name='John', last_name='Doe';

-- Insert sample order
INSERT INTO checkout_orders (order_reference, user_id, email, phone, shipping_address)
VALUES (
    'ORD-20260818-SEED1',
    (SELECT id FROM users WHERE email='john.doe@example.com' LIMIT 1),
    'john.doe@example.com',
    '+1 (555) 123-4567',
    '123 Innovation Way, Tech District, San Francisco, CA 94105'
)
ON DUPLICATE KEY UPDATE shipping_address=VALUES(shipping_address);
