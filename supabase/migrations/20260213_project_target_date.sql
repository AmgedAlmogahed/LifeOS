-- Add target_date to projects for calendar and timeline views
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_date DATE;
