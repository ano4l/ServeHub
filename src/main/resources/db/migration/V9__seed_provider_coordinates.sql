-- ============================================================
-- V9: Seed provider coordinates for local browse radius filters
-- ============================================================

UPDATE providers
SET latitude = -26.2041, longitude = 28.0473
WHERE user_id = (SELECT id FROM users WHERE email = 'provider@servehub.dev');

UPDATE providers
SET latitude = -33.9249, longitude = 18.4241
WHERE user_id = (SELECT id FROM users WHERE email = 'sarah@servehub.dev');

UPDATE providers
SET latitude = -25.7479, longitude = 28.2293
WHERE user_id = (SELECT id FROM users WHERE email = 'nina@servehub.dev');

UPDATE providers
SET latitude = -26.1076, longitude = 28.0567
WHERE user_id = (SELECT id FROM users WHERE email = 'lebo@servehub.dev');

UPDATE providers
SET latitude = -29.8587, longitude = 31.0218
WHERE user_id = (SELECT id FROM users WHERE email = 'paws@servehub.dev');

UPDATE providers
SET latitude = -25.9992, longitude = 28.1263
WHERE user_id = (SELECT id FROM users WHERE email = 'bluewater@servehub.dev');

UPDATE providers
SET latitude = -25.7564, longitude = 28.1910
WHERE user_id = (SELECT id FROM users WHERE email = 'happytails@servehub.dev');
