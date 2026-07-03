/*
# Add sandbox_mode to profiles

## Overview
Adds a boolean column to let each user toggle a "Sandbox Test Mode".
When enabled, the posting engine simulates social media publishing
instead of calling live YouTube/Instagram APIs.

## Changes

### Modified Tables

#### profiles
- `sandbox_mode` (boolean, default false): When true, the pipeline
  routes posting through mock implementations that log a simulated
  success event, store a dummy post URL, and still trigger the
  aggressive disk cleanup routine.

## Security
- No new tables. Existing owner-scoped UPDATE policy on `profiles`
  already covers the new column — no policy changes needed.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sandbox_mode boolean NOT NULL DEFAULT false;
