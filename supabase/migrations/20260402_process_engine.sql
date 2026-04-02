-- Business Process Engine Migration

-- 1. Create Enums for Pipeline Stages
CREATE TYPE pipeline_stage AS ENUM (
  'lead_new', 'lead_contacted', 'lead_qualified',
  'opportunity_created', 'quote_draft', 'quote_sent', 'quote_negotiation',
  'quote_won', 'quote_lost', 'quote_postponed',
  'contract_draft', 'contract_sent', 'contract_active',
  'project_planning', 'project_active', 'project_delivered',
  'invoiced', 'paid', 'closed'
);

-- 2. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id),
  channel text,
  contact_name text NOT NULL,
  mobile text,
  email text,
  service_interest text,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST')),
  converted_client_id uuid REFERENCES public.clients(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id)
);

-- 3. Pipeline Tracker Table
CREATE TABLE IF NOT EXISTS public.pipeline_tracker (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id),
  current_stage pipeline_stage NOT NULL DEFAULT 'lead_new',
  lead_id uuid REFERENCES public.leads(id),
  client_id uuid REFERENCES public.clients(id),
  opportunity_id uuid REFERENCES public.opportunities(id),
  quote_id uuid REFERENCES public.price_offers(id),
  contract_id uuid REFERENCES public.contracts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pipeline_tracker_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pipeline_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tracker_id uuid NOT NULL REFERENCES public.pipeline_tracker(id) ON DELETE CASCADE,
  stage pipeline_stage NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pipeline_history_pkey PRIMARY KEY (id)
);

-- 4. Quote Line Items Table
CREATE TABLE IF NOT EXISTS public.quote_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.price_offers(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  service_category text, -- Matches project_category enum or project_templates
  unit_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL DEFAULT 0,
  creates_project boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quote_line_items_pkey PRIMARY KEY (id)
);

-- Add tracker_id to projects to link them back
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tracker_id uuid REFERENCES public.pipeline_tracker(id);

-- 5. RPC: Advance Pipeline
CREATE OR REPLACE FUNCTION advance_pipeline(
  p_tracker_id uuid,
  p_new_stage text,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate stage using casting
  UPDATE public.pipeline_tracker
  SET current_stage = p_new_stage::pipeline_stage,
      updated_at = now()
  WHERE id = p_tracker_id;

  INSERT INTO public.pipeline_history (tracker_id, stage, note)
  VALUES (p_tracker_id, p_new_stage::pipeline_stage, p_note);
END;
$$;

-- 6. RPC: Create Project with Framework
CREATE OR REPLACE FUNCTION create_project_with_framework(
  p_name text,
  p_category text,
  p_client_id uuid DEFAULT NULL,
  p_account_id uuid DEFAULT NULL,
  p_contract_id uuid DEFAULT NULL,
  p_tracker_id uuid DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
  v_template record;
  v_phase record;
  v_task record;
  v_phase_index int := 0;
  v_stage_history jsonb := '[]'::jsonb;
  v_current_stage text := 'Requirements';
BEGIN
  -- Create project
  INSERT INTO public.projects (name, category, client_id, account_id, contract_id, tracker_id, status, progress, is_frozen)
  VALUES (p_name, p_category::project_category, p_client_id, p_account_id, p_contract_id, p_tracker_id, 'Understand', 0, false)
  RETURNING id INTO v_project_id;

  -- Fetch matching template from DB
  SELECT * INTO v_template FROM public.project_templates WHERE category = p_category LIMIT 1;

  IF FOUND AND v_template.phases IS NOT NULL THEN
    -- Build stage history
    FOR v_phase IN SELECT * FROM jsonb_array_elements(v_template.phases::jsonb) LOOP
      IF v_phase_index = 0 THEN
        v_current_stage := v_phase->>'name';
        v_stage_history := v_stage_history || jsonb_build_object('name', v_phase->>'name', 'order', v_phase->>'order', 'entered_at', now(), 'completed_at', null);
      ELSE
        v_stage_history := v_stage_history || jsonb_build_object('name', v_phase->>'name', 'order', v_phase->>'order', 'entered_at', null, 'completed_at', null);
      END IF;
      v_phase_index := v_phase_index + 1;
    END LOOP;

    -- Create lifecycle
    INSERT INTO public.lifecycles (project_id, current_stage, stage_history, started_at)
    VALUES (v_project_id, v_current_stage::lifecycle_stage, v_stage_history, now());

    -- Create context
    INSERT INTO public.project_state_context (project_id, current_blockers)
    VALUES (v_project_id, '{}');

    -- Insert tasks
    v_phase_index := 0;
    FOR v_phase IN SELECT * FROM jsonb_array_elements(v_template.phases::jsonb) LOOP
      FOR v_task IN SELECT * FROM jsonb_array_elements(v_phase->'tasks') LOOP
        INSERT INTO public.tasks (project_id, title, type, priority, energy_level, estimated_minutes, status, metadata)
        VALUES (
          v_project_id,
          v_task->>'title',
          v_task->>'type',
          v_task->>'priority',
          v_task->>'energy_level',
          (v_task->>'estimated_minutes')::int,
          'Todo',
          jsonb_build_object('from_template', true, 'phase', v_phase->>'name', 'backlog', (v_phase_index > 0))
        );
      END LOOP;
      v_phase_index := v_phase_index + 1;
    END LOOP;
  ELSE
    -- Fallback
    INSERT INTO public.lifecycles (project_id, current_stage, stage_history, started_at)
    VALUES (v_project_id, 'Requirements', '[{"stage": "Requirements"}]'::jsonb, now());
    INSERT INTO public.project_state_context (project_id, current_blockers)
    VALUES (v_project_id, '{}');
  END IF;

  RETURN json_build_object('success', true, 'project_id', v_project_id);
END;
$$;

-- 7. RPC: Create Projects from Quote
CREATE OR REPLACE FUNCTION create_projects_from_quote(
  p_quote_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote record;
  v_item record;
  v_project_ids uuid[] := '{}';
  v_res json;
  v_tracker_id uuid;
BEGIN
  -- Get quote details
  SELECT * INTO v_quote FROM public.price_offers WHERE id = p_quote_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  -- Find associated pipeline tracker
  SELECT id INTO v_tracker_id FROM public.pipeline_tracker WHERE quote_id = p_quote_id LIMIT 1;

  -- Read quote line items that create a project
  FOR v_item IN SELECT * FROM public.quote_line_items WHERE quote_id = p_quote_id AND creates_project = true LOOP
    -- Combine client name and service name for the new project name naturally
    -- Or just use service_name, prepended with client company name
    -- Actually, to keep it simple, use 'ClientName - ServiceName' 
    -- Assuming we have a client record
    -- Let create_project_with_framework handle it
    v_res := create_project_with_framework(
      p_name := (SELECT name FROM public.clients WHERE id = v_quote.client_id) || ' — ' || v_item.service_name,
      p_category := v_item.service_category,
      p_client_id := v_quote.client_id,
      p_account_id := v_quote.account_id,
      p_contract_id := NULL, -- Or link if contract exists
      p_tracker_id := v_tracker_id
    );
    
    v_project_ids := array_append(v_project_ids, (v_res->>'project_id')::uuid);
  END LOOP;

  RETURN json_build_object('success', true, 'projects_created', array_length(v_project_ids, 1), 'project_ids', v_project_ids);
END;
$$;
