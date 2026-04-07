-- ============================================================
-- V6: Normalize demo login credentials
-- Shared demo password: ServeHub123!
-- ============================================================

UPDATE users
SET
    password_hash = '$2a$10$aNZ98CFTpKX1Yp.Lk/9eqO14tgjHoryztfys3ZVAwffKTfc8TxVIq',
    email_verified = true
WHERE email IN (
    'customer@servehub.dev',
    'provider@servehub.dev',
    'admin@servehub.dev',
    'showcase@servehub.dev',
    'sarah@servehub.dev',
    'nina@servehub.dev',
    'lebo@servehub.dev',
    'paws@servehub.dev',
    'bluewater@servehub.dev',
    'happytails@servehub.dev'
);
