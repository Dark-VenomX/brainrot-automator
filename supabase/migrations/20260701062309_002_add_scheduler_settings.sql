/*
# Add scheduler_settings to profiles

## Overview
Adds a JSONB column to store per-user dynamic scheduling configuration,
replacing the hardcoded 12:30 PM / 7:30 PM IST posting slots.

## Changes

### Modified Tables

#### profiles
- `scheduler_settings` (jsonb, default '{}'): Stores the user's custom
  schedule configuration. Shape:
  {
    "enabled": true,
    "days_of_week": [1,2,3,4,5],   // 0=Sun ... 6=Sat
    "videos_per_day": 3,
    "time_slots": ["09:00","14:00","20:00"]
  }
- `scheduler_updated_at` (timestamptz): When the user last saved their
  schedule configuration.

## Security
- No new tables. Existing owner-scoped UPDATE policy on `profiles`
  already covers the new column — no policy changes needed.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS scheduler_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS scheduler_updated_at timestamptz;

-- Backfill empty settings for existing rows so reads are predictable
UPDATE profiles
SET scheduler_settings = '{}'::jsonb
WHERE scheduler_settings IS NULL;
