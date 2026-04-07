--- V8: Add payfast_payment_id to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payfast_payment_id VARCHAR(80);

CREATE INDEX IF NOT EXISTS idx_payments_payfast_id ON payments(payfast_payment_id);
