-- Add unique constraint on (user_id, plan_date) for daily_plans
-- Required by the upsert in getOrCreateDailyPlan() which uses onConflict: 'user_id,plan_date'

ALTER TABLE daily_plans
  ADD CONSTRAINT daily_plans_user_id_plan_date_key UNIQUE (user_id, plan_date);
