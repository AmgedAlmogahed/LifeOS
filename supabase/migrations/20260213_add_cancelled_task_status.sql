-- Add 'Cancelled' to the task_status enum
-- This supports the "Drop" action during sprint carry-forward (Sprint 2)

ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'Cancelled';
