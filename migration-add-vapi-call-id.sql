-- Migration: Add VAPI call log columns to candidates table
-- These columns store comprehensive call data from VAPI dashboard

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS vapi_call_id TEXT,
ADD COLUMN IF NOT EXISTS assistant_name TEXT,
ADD COLUMN IF NOT EXISTS assistant_id TEXT,
ADD COLUMN IF NOT EXISTS assistant_phone_number TEXT,
ADD COLUMN IF NOT EXISTS call_type TEXT,
ADD COLUMN IF NOT EXISTS ended_reason TEXT,
ADD COLUMN IF NOT EXISTS success_evaluation TEXT,
ADD COLUMN IF NOT EXISTS score TEXT,
ADD COLUMN IF NOT EXISTS call_duration INTEGER,
ADD COLUMN IF NOT EXISTS call_cost NUMERIC(10, 2);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidates_vapi_call_id ON candidates(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_candidates_assistant_id ON candidates(assistant_id);

-- Add comments to document the columns
COMMENT ON COLUMN candidates.vapi_call_id IS 'VAPI call ID for tracking and syncing calls with VAPI dashboard';
COMMENT ON COLUMN candidates.assistant_name IS 'Name of the VAPI assistant used for the call';
COMMENT ON COLUMN candidates.assistant_id IS 'VAPI assistant ID';
COMMENT ON COLUMN candidates.assistant_phone_number IS 'Phone number used by the assistant';
COMMENT ON COLUMN candidates.call_type IS 'Type of call: outbound or web';
COMMENT ON COLUMN candidates.ended_reason IS 'Reason why the call ended';
COMMENT ON COLUMN candidates.success_evaluation IS 'Success evaluation: pass or fail';
COMMENT ON COLUMN candidates.score IS 'Call score/rating';
COMMENT ON COLUMN candidates.call_duration IS 'Call duration in seconds';
COMMENT ON COLUMN candidates.call_cost IS 'Cost of the call in USD';

