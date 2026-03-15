-- ============================================================
-- V5: Showcase seed data
-- All demo accounts share the same password used in V1.
-- Check V1__initial_marketplace_schema.sql for the hash or
-- run: POST /api/v1/auth/register to create fresh accounts.
-- ============================================================

-- ---- Extra categories (mobile-first service types) ----
INSERT INTO categories (name, slug, icon, display_order) VALUES
    ('Hair',         'hair',         'Scissors',   11),
    ('Makeup',       'makeup',       'Sparkles',   12),
    ('Dog Washing',  'dog-washing',  'PawPrint',   13),
    ('Dog Walking',  'dog-walking',  'Footprints', 14),
    ('Pool Cleaning','pool-cleaning','Droplets',   15)
ON CONFLICT (slug) DO NOTHING;

-- ---- Admin account ----
INSERT INTO users (full_name, email, phone_number, password_hash, role)
VALUES ('ServeHub Admin', 'admin@servehub.dev', '+27110000099',
        '$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- ---- Additional customer ----
INSERT INTO users (full_name, email, phone_number, password_hash, role)
VALUES ('Showcase Customer', 'showcase@servehub.dev', '+27110000003',
        '$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'CUSTOMER')
ON CONFLICT (email) DO NOTHING;

-- ---- Provider user accounts ----
INSERT INTO users (full_name, email, phone_number, password_hash, role)
VALUES
    ('Sarah Johnson',      'sarah@servehub.dev',   '+27110000010', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'PROVIDER'),
    ('Nina Styles',        'nina@servehub.dev',    '+27110000011', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'PROVIDER'),
    ('Lebo Mokoena',       'lebo@servehub.dev',    '+27110000012', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'PROVIDER'),
    ('Paws and Bubbles',   'paws@servehub.dev',    '+27110000013', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'PROVIDER'),
    ('Bluewater Pros',     'bluewater@servehub.dev','+27110000014','$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'PROVIDER'),
    ('Happy Tails Walkers','happytails@servehub.dev','+27110000015','$2a$10$dXJ3SW6G7P50lGmMkkmwe.OJg7j0rGUNShUMHbOWcZH/5LiCFYI8a', 'PROVIDER')
ON CONFLICT (email) DO NOTHING;

-- ---- Provider profiles ----
INSERT INTO providers (user_id, verification_status, city, service_radius_km, bio)
SELECT u.id, 'VERIFIED', 'Cape Town', 20,
       'Deep cleans, move-out refreshes, and eco-friendly home upkeep.'
FROM users u WHERE u.email = 'sarah@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM providers p WHERE p.user_id = u.id);

INSERT INTO providers (user_id, verification_status, city, service_radius_km, bio)
SELECT u.id, 'VERIFIED', 'Pretoria', 25,
       'Braids, silk press, and at-home styling for events and everyday looks.'
FROM users u WHERE u.email = 'nina@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM providers p WHERE p.user_id = u.id);

INSERT INTO providers (user_id, verification_status, city, service_radius_km, bio)
SELECT u.id, 'VERIFIED', 'Sandton', 20,
       'Soft glam, bridal, and content-ready makeup with pro-grade products.'
FROM users u WHERE u.email = 'lebo@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM providers p WHERE p.user_id = u.id);

INSERT INTO providers (user_id, verification_status, city, service_radius_km, bio)
SELECT u.id, 'VERIFIED', 'Durban', 30,
       'Gentle wash, brush-out, and coat refresh for dogs of every size.'
FROM users u WHERE u.email = 'paws@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM providers p WHERE p.user_id = u.id);

INSERT INTO providers (user_id, verification_status, city, service_radius_km, bio)
SELECT u.id, 'VERIFIED', 'Midrand', 35,
       'Pool balancing, cleaning, and regular maintenance with clear pricing.'
FROM users u WHERE u.email = 'bluewater@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM providers p WHERE p.user_id = u.id);

INSERT INTO providers (user_id, verification_status, city, service_radius_km, bio)
SELECT u.id, 'VERIFIED', 'Pretoria', 15,
       'Trusted neighbourhood walks with updates, photos, and repeat scheduling.'
FROM users u WHERE u.email = 'happytails@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM providers p WHERE p.user_id = u.id);

-- ---- Seed ratings so providers appear in search results ----
UPDATE providers SET average_rating = 4.9, review_count = 342
WHERE user_id = (SELECT id FROM users WHERE email = 'sarah@servehub.dev');

UPDATE providers SET average_rating = 4.9, review_count = 201
WHERE user_id = (SELECT id FROM users WHERE email = 'nina@servehub.dev');

UPDATE providers SET average_rating = 5.0, review_count = 156
WHERE user_id = (SELECT id FROM users WHERE email = 'lebo@servehub.dev');

UPDATE providers SET average_rating = 4.7, review_count = 118
WHERE user_id = (SELECT id FROM users WHERE email = 'paws@servehub.dev');

UPDATE providers SET average_rating = 4.8, review_count = 94
WHERE user_id = (SELECT id FROM users WHERE email = 'bluewater@servehub.dev');

UPDATE providers SET average_rating = 4.8, review_count = 132
WHERE user_id = (SELECT id FROM users WHERE email = 'happytails@servehub.dev');

-- ---- Services for Sarah Johnson (Cleaning) ----
INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Cleaning', 'Professional Home Cleaning', 'FIXED', 450.00, 120
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'sarah@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Professional Home Cleaning');

INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Cleaning', 'Move-Out Deep Clean', 'FIXED', 950.00, 300
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'sarah@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Move-Out Deep Clean');

INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Cleaning', 'Weekly Maintenance Clean', 'FIXED', 280.00, 75
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'sarah@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Weekly Maintenance Clean');

-- ---- Services for Nina Styles (Hair) ----
INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Hair', 'Silk Press and Style', 'FIXED', 380.00, 90
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'nina@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Silk Press and Style');

INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Hair', 'Box Braids', 'FIXED', 650.00, 300
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'nina@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Box Braids');

INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Hair', 'Wash and Blow-Dry', 'FIXED', 220.00, 60
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'nina@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Wash and Blow-Dry');

-- ---- Services for Lebo Mokoena (Makeup) ----
INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Makeup', 'Bridal Soft Glam', 'FIXED', 650.00, 75
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'lebo@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Bridal Soft Glam');

INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Makeup', 'Event Glam', 'FIXED', 450.00, 60
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'lebo@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Event Glam');

INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Makeup', 'Natural Everyday Makeup', 'FIXED', 280.00, 45
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'lebo@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Natural Everyday Makeup');

-- ---- Services for Paws and Bubbles (Dog Washing) ----
INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Dog Washing', 'Dog Bath and Brush-Out', 'FIXED', 220.00, 45
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'paws@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Dog Bath and Brush-Out');

INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Dog Washing', 'Full Groom and Nail Trim', 'FIXED', 380.00, 90
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'paws@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Full Groom and Nail Trim');

-- ---- Services for Bluewater Pros (Pool Cleaning) ----
INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Pool Cleaning', 'Weekly Pool Refresh', 'FIXED', 540.00, 60
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'bluewater@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'Weekly Pool Refresh');

INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Pool Cleaning', 'One-Time Deep Clean', 'FIXED', 1200.00, 180
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'bluewater@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = 'One-Time Deep Clean');

-- ---- Services for Happy Tails Walkers (Dog Walking) ----
INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Dog Walking', '30-Minute Walk', 'FIXED', 180.00, 30
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'happytails@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = '30-Minute Walk');

INSERT INTO provider_services (provider_id, category, service_name, pricing_type, price, estimated_duration_minutes)
SELECT p.id, 'Dog Walking', '60-Minute Walk', 'FIXED', 300.00, 60
FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'happytails@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM provider_services s WHERE s.provider_id = p.id AND s.service_name = '60-Minute Walk');

-- ---- Showcase booking: customer -> Sarah Johnson (IN_PROGRESS) ----
INSERT INTO bookings (customer_id, provider_id, service_offering_id, status, scheduled_for, address, notes, quoted_price)
SELECT
    (SELECT id FROM users WHERE email = 'customer@servehub.dev'),
    (SELECT p.id FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'sarah@servehub.dev'),
    (SELECT ps.id FROM provider_services ps
        JOIN providers p ON p.id = ps.provider_id
        JOIN users u ON u.id = p.user_id
        WHERE u.email = 'sarah@servehub.dev' AND ps.service_name = 'Professional Home Cleaning'
        LIMIT 1),
    'IN_PROGRESS',
    now() + interval '2 hours',
    '14 Glen Road, Cape Town',
    'Please bring eco-friendly products.',
    450.00
WHERE NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.customer_id = (SELECT id FROM users WHERE email = 'customer@servehub.dev')
    AND b.status = 'IN_PROGRESS'
);

-- ---- Showcase booking: customer -> Lebo Mokoena (ACCEPTED) ----
INSERT INTO bookings (customer_id, provider_id, service_offering_id, status, scheduled_for, address, notes, quoted_price)
SELECT
    (SELECT id FROM users WHERE email = 'customer@servehub.dev'),
    (SELECT p.id FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'lebo@servehub.dev'),
    (SELECT ps.id FROM provider_services ps
        JOIN providers p ON p.id = ps.provider_id
        JOIN users u ON u.id = p.user_id
        WHERE u.email = 'lebo@servehub.dev' AND ps.service_name = 'Bridal Soft Glam'
        LIMIT 1),
    'ACCEPTED',
    now() + interval '1 day',
    '18 Parkview Drive, Sandton',
    null,
    650.00
WHERE NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.customer_id = (SELECT id FROM users WHERE email = 'customer@servehub.dev')
    AND b.status = 'ACCEPTED'
);

-- ---- Showcase booking: customer -> Bluewater Pros (COMPLETED) ----
INSERT INTO bookings (customer_id, provider_id, service_offering_id, status, scheduled_for, address, notes, quoted_price)
SELECT
    (SELECT id FROM users WHERE email = 'customer@servehub.dev'),
    (SELECT p.id FROM providers p JOIN users u ON u.id = p.user_id WHERE u.email = 'bluewater@servehub.dev'),
    (SELECT ps.id FROM provider_services ps
        JOIN providers p ON p.id = ps.provider_id
        JOIN users u ON u.id = p.user_id
        WHERE u.email = 'bluewater@servehub.dev' AND ps.service_name = 'Weekly Pool Refresh'
        LIMIT 1),
    'COMPLETED',
    now() - interval '3 days',
    '7 Palm Estate, Midrand',
    null,
    540.00
WHERE NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.customer_id = (SELECT id FROM users WHERE email = 'customer@servehub.dev')
    AND b.status = 'COMPLETED'
);

-- ---- Chat messages on the IN_PROGRESS booking ----
INSERT INTO chat_messages (booking_id, sender_id, content, sent_at)
SELECT
    b.id,
    (SELECT id FROM users WHERE email = 'sarah@servehub.dev'),
    'I am finishing my previous job and will head over in about 20 minutes.',
    now() - interval '5 minutes'
FROM bookings b
WHERE b.status = 'IN_PROGRESS'
  AND b.customer_id = (SELECT id FROM users WHERE email = 'customer@servehub.dev')
  AND NOT EXISTS (SELECT 1 FROM chat_messages m WHERE m.booking_id = b.id);

INSERT INTO chat_messages (booking_id, sender_id, content, sent_at)
SELECT
    b.id,
    (SELECT id FROM users WHERE email = 'customer@servehub.dev'),
    'Perfect, please ring the side gate on arrival.',
    now() - interval '3 minutes'
FROM bookings b
WHERE b.status = 'IN_PROGRESS'
  AND b.customer_id = (SELECT id FROM users WHERE email = 'customer@servehub.dev');

-- ---- Sample notifications for the customer ----
INSERT INTO notifications (user_id, type, title, message, read)
SELECT id, 'BOOKING', 'Booking Accepted',
       'Lebo Mokoena accepted your makeup booking for tomorrow morning.', false
FROM users WHERE email = 'customer@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM notifications n
    WHERE n.user_id = (SELECT id FROM users WHERE email = 'customer@servehub.dev')
    AND n.type = 'BOOKING');

INSERT INTO notifications (user_id, type, title, message, read)
SELECT id, 'MESSAGE', 'New Message',
       'Sarah Johnson: I am finishing my previous job and will head over in about 20 minutes.', false
FROM users WHERE email = 'customer@servehub.dev'
AND NOT EXISTS (SELECT 1 FROM notifications n
    WHERE n.user_id = (SELECT id FROM users WHERE email = 'customer@servehub.dev')
    AND n.type = 'MESSAGE');
