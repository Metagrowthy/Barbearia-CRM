-- Migration for Subscriptions
-- Run this in your Supabase SQL Editor

-- 1. Add subscription columns to Establishments Table
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 days'),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2. Update existing establishments to have a trial if they don't have one (retroactive fix)
UPDATE establishments 
SET trial_ends_at = created_at + INTERVAL '10 days'
WHERE trial_ends_at IS NULL;
