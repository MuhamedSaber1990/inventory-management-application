-- ============================================
--  Seed Data for Inventory System (20 Products)
-- ============================================

-- ============================================
--  Seed Data: 20 Products
-- ============================================

INSERT INTO products 
(name, sku, bar_code, price, cost_price, quantity, min_quantity, category, description, status) 
VALUES
('ProBook X1 Laptop', 'LAP-001', '1000000000001', 1200.00, 850.00, 15, 5, 'Electronics', 'High-performance laptop with 16GB RAM and 512GB SSD.', 'active'),
('ErgoFit Office Chair', 'FUR-101', '1000000000002', 249.99, 120.00, 8, 10, 'Furniture', 'Ergonomic mesh chair with lumbar support.', 'active'),
('Wireless Noise-Cancel Headphones', 'AUD-201', '1000000000003', 199.50, 90.00, 25, 10, 'Audio', 'Over-ear headphones with 30-hour battery life.', 'active'),
('Mechanical Keyboard RGB', 'ACC-301', '1000000000004', 89.99, 45.00, 40, 15, 'Accessories', 'Tactile mechanical switches with customizable RGB lighting.', 'active'),
('4K Ultra Monitor 27"', 'MON-401', '1000000000005', 320.00, 210.00, 12, 5, 'Electronics', '27-inch IPS display with HDR support.', 'active'),
('Smartphone Stand Aluminum', 'ACC-302', '1000000000006', 15.99, 5.50, 100, 20, 'Accessories', 'Adjustable aluminum stand for phones and tablets.', 'active'),
('Smart LED Bulb', 'HOM-501', '1000000000007', 12.50, 4.00, 60, 20, 'Smart Home', 'WiFi-enabled RGB bulb compatible with Alexa/Google.', 'active'),
('Bluetooth Speaker Mini', 'AUD-202', '1000000000008', 29.99, 12.00, 35, 10, 'Audio', 'Portable waterproof speaker with deep bass.', 'active'),
('USB-C Hub 7-in-1', 'ACC-303', '1000000000009', 45.00, 18.00, 22, 10, 'Accessories', 'Expands USB-C port to HDMI, USB 3.0, and SD card reader.', 'active'),
('Gaming Mouse Precision', 'ACC-304', '1000000000010', 55.00, 25.00, 18, 10, 'Accessories', 'High DPI gaming mouse with programmable buttons.', 'active'),
('Standing Desk Motorized', 'FUR-102', '1000000000011', 450.00, 280.00, 4, 2, 'Furniture', 'Dual-motor electric standing desk with memory presets.', 'active'),
('Webcam 1080p HD', 'ELE-005', '1000000000012', 65.00, 30.00, 14, 10, 'Electronics', 'Wide-angle webcam with privacy shutter.', 'active'),
('External SSD 1TB', 'STO-601', '1000000000013', 110.00, 75.00, 20, 5, 'Storage', 'Rugged portable SSD with fast transfer speeds.', 'active'),
('Wi-Fi 6 Router', 'NET-701', '1000000000014', 130.00, 80.00, 9, 5, 'Networking', 'Dual-band router for high-speed home internet.', 'active'),
('Cable Organizer Clips', 'ORG-801', '1000000000015', 5.99, 1.50, 150, 30, 'Organization', 'Pack of 10 adhesive cable management clips.', 'active'),
('Laptop Sleeve 15"', 'ACC-305', '1000000000016', 19.99, 8.00, 45, 15, 'Accessories', 'Water-resistant protective sleeve with soft lining.', 'active'),
('Power Bank 20000mAh', 'ACC-306', '1000000000017', 39.99, 20.00, 30, 10, 'Accessories', 'Fast charging portable battery for multiple devices.', 'active'),
('Smart Security Camera', 'HOM-502', '1000000000018', 59.99, 35.00, 16, 5, 'Smart Home', 'Indoor camera with night vision and motion detection.', 'active'),
('Screen Cleaning Kit', 'CLN-901', '1000000000019', 9.99, 3.00, 75, 20, 'Cleaning', 'Microfiber cloth and cleaning solution spray.', 'active'),
('Wireless Charging Pad', 'ACC-307', '1000000000020', 24.99, 10.00, 28, 10, 'Accessories', '15W fast wireless charger for Qi-enabled devices.', 'active');