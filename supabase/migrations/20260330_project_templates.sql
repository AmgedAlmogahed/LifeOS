-- Migration to add Project Templates mapped to Lifecycle Phases

CREATE TABLE IF NOT EXISTS public.project_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  phases jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_templates_pkey PRIMARY KEY (id)
);

-- Enable RLS for project_templates
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to project_templates"
ON public.project_templates
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Relax lifecycles.current_stage to generic text to allow custom phases.
-- The existing ENUM type is "lifecycle_stage".
ALTER TABLE public.lifecycles
  ALTER COLUMN current_stage DROP DEFAULT,
  ALTER COLUMN current_stage TYPE text USING current_stage::text;


-- Seed the frameworks JSON payloads

INSERT INTO public.project_templates (category, name, description, phases) VALUES 
('ERP', 'ERP / Platform', 'Large-scale enterprise platforms (4-12 months)', '[
  {"name": "Discovery & Requirements", "order": 1, "tasks": [
    {"title": "Kickoff meeting with client", "type": "Admin", "priority": "High", "energy_level": "shallow", "estimated_minutes": 60},
    {"title": "Document current workflows & pain points", "type": "Research", "priority": "High", "energy_level": "deep", "estimated_minutes": 120},
    {"title": "Define system modules & scope", "type": "Planning", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 180},
    {"title": "Map data entities & relationships", "type": "Planning", "priority": "High", "energy_level": "deep", "estimated_minutes": 120},
    {"title": "Identify integrations needed", "type": "Research", "priority": "Medium", "energy_level": "deep", "estimated_minutes": 90},
    {"title": "Write technical requirements spec", "type": "Documentation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 240}
  ]},
  {"name": "Architecture & Design", "order": 2, "tasks": [
    {"title": "Design database schema", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 180},
    {"title": "Design system architecture", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 180},
    {"title": "Design UI kit / component library", "type": "Design", "priority": "High", "energy_level": "deep", "estimated_minutes": 180}
  ]},
  {"name": "Core Development", "order": 3, "tasks": [
    {"title": "Implement authentication", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 240},
    {"title": "Build database migrations", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 120},
    {"title": "Build core CRUD APIs", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 360}
  ]},
  {"name": "Module Development", "order": 4, "tasks": [
    {"title": "Build module-specific APIs", "type": "Implementation", "priority": "High", "energy_level": "deep", "estimated_minutes": 360},
    {"title": "Build module frontend pages", "type": "Implementation", "priority": "High", "energy_level": "deep", "estimated_minutes": 360}
  ]},
  {"name": "Testing & QA", "order": 5, "tasks": [
    {"title": "End-to-end testing", "type": "Testing", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 360},
    {"title": "Security audit", "type": "Testing", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 180}
  ]},
  {"name": "Deployment & Launch", "order": 6, "tasks": [
    {"title": "Set up production environment", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 120},
    {"title": "Deploy to production", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 90}
  ]},
  {"name": "Delivery & Support", "order": 7, "tasks": [
    {"title": "Post-launch monitoring", "type": "Maintenance", "priority": "High", "energy_level": "shallow", "estimated_minutes": 60},
    {"title": "Handover documentation", "type": "Documentation", "priority": "High", "energy_level": "deep", "estimated_minutes": 120}
  ]}
]') ON CONFLICT (category) DO NOTHING;

INSERT INTO public.project_templates (category, name, description, phases) VALUES 
('WebApp', 'Web Application', 'Standard web application development (2-6 months)', '[
  {"name": "Planning & Design", "order": 1, "tasks": [
    {"title": "Define project scope & objectives", "type": "Planning", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 90},
    {"title": "Design UI mockups", "type": "Design", "priority": "High", "energy_level": "deep", "estimated_minutes": 240}
  ]},
  {"name": "Frontend Development", "order": 2, "tasks": [
    {"title": "Build layout & navigation", "type": "Implementation", "priority": "High", "energy_level": "deep", "estimated_minutes": 120},
    {"title": "Implement pages & components", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 360}
  ]},
  {"name": "Backend Development", "order": 3, "tasks": [
    {"title": "Design & implement database schema", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 120},
    {"title": "Build REST/GraphQL APIs", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 240}
  ]},
  {"name": "Testing & Polish", "order": 4, "tasks": [
    {"title": "End-to-end testing", "type": "Testing", "priority": "High", "energy_level": "deep", "estimated_minutes": 180},
    {"title": "Security review", "type": "Testing", "priority": "High", "energy_level": "deep", "estimated_minutes": 90}
  ]},
  {"name": "Deploy & Deliver", "order": 5, "tasks": [
    {"title": "Set up production & Deploy", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 90},
    {"title": "Documentation", "type": "Documentation", "priority": "Medium", "energy_level": "deep", "estimated_minutes": 90}
  ]}
]') ON CONFLICT (category) DO NOTHING;

INSERT INTO public.project_templates (category, name, description, phases) VALUES 
('SimpleWebsite', 'Simple Website', 'Informational / corporate sites (1-4 weeks)', '[
  {"name": "Design", "order": 1, "tasks": [
    {"title": "Gather content & brand assets", "type": "Admin", "priority": "Critical", "energy_level": "shallow", "estimated_minutes": 60},
    {"title": "Design homepage mockup", "type": "Design", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 180}
  ]},
  {"name": "Build", "order": 2, "tasks": [
    {"title": "Build homepage", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 180},
    {"title": "Mobile responsiveness", "type": "Implementation", "priority": "High", "energy_level": "deep", "estimated_minutes": 90}
  ]},
  {"name": "Launch", "order": 3, "tasks": [
    {"title": "Client review & feedback round", "type": "Admin", "priority": "High", "energy_level": "shallow", "estimated_minutes": 60},
    {"title": "Deploy & go live", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 30}
  ]}
]') ON CONFLICT (category) DO NOTHING;

INSERT INTO public.project_templates (category, name, description, phases) VALUES 
('MobileApp', 'Mobile App', 'Native or hybrid applications (3-8 months)', '[
  {"name": "Planning & Design", "order": 1, "tasks": [
    {"title": "Design UI/UX in Figma (mobile-first)", "type": "Design", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 360}
  ]},
  {"name": "Core Development", "order": 2, "tasks": [
    {"title": "Implement authentication", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 180},
    {"title": "Build core screens", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 360}
  ]},
  {"name": "Feature Development", "order": 3, "tasks": [
    {"title": "Build secondary screens & features", "type": "Implementation", "priority": "High", "energy_level": "deep", "estimated_minutes": 360}
  ]},
  {"name": "Testing", "order": 4, "tasks": [
    {"title": "Device testing (iOS + Android)", "type": "Testing", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 180}
  ]},
  {"name": "Launch", "order": 5, "tasks": [
    {"title": "Prepare store listings", "type": "Admin", "priority": "High", "energy_level": "shallow", "estimated_minutes": 120},
    {"title": "Submit to App Stores", "type": "Admin", "priority": "Critical", "energy_level": "shallow", "estimated_minutes": 60}
  ]}
]') ON CONFLICT (category) DO NOTHING;

INSERT INTO public.project_templates (category, name, description, phases) VALUES 
('Marketing', 'Marketing Campaign', 'Digital outreach, ads, SEO (2-8 weeks)', '[
  {"name": "Research & Strategy", "order": 1, "tasks": [
    {"title": "Audience research & persona definition", "type": "Research", "priority": "High", "energy_level": "deep", "estimated_minutes": 90}
  ]},
  {"name": "Content Creation", "order": 2, "tasks": [
    {"title": "Write copy for all channels", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 180},
    {"title": "Design visual assets", "type": "Design", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 240}
  ]},
  {"name": "Setup & Configuration", "order": 3, "tasks": [
    {"title": "Set up ad accounts & targeting", "type": "Implementation", "priority": "High", "energy_level": "deep", "estimated_minutes": 90}
  ]},
  {"name": "Launch & Monitor", "order": 4, "tasks": [
    {"title": "Launch campaign", "type": "Implementation", "priority": "Critical", "energy_level": "shallow", "estimated_minutes": 30}
  ]},
  {"name": "Analyze & Report", "order": 5, "tasks": [
    {"title": "Compile final campaign metrics", "type": "Research", "priority": "High", "energy_level": "deep", "estimated_minutes": 90}
  ]}
]') ON CONFLICT (category) DO NOTHING;

INSERT INTO public.project_templates (category, name, description, phases) VALUES 
('Branding', 'Branding & Identity', 'Logo, brand guidelines, visual identity (2-6 weeks)', '[
  {"name": "Discovery", "order": 1, "tasks": [
    {"title": "Brand questionnaire / interview", "type": "Research", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 90}
  ]},
  {"name": "Design", "order": 2, "tasks": [
    {"title": "Logo concept exploration", "type": "Design", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 300}
  ]},
  {"name": "Brand System", "order": 3, "tasks": [
    {"title": "Build brand guidelines document", "type": "Documentation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 240}
  ]},
  {"name": "Delivery", "order": 4, "tasks": [
    {"title": "Package all deliverables", "type": "Admin", "priority": "High", "energy_level": "shallow", "estimated_minutes": 30}
  ]}
]') ON CONFLICT (category) DO NOTHING;

INSERT INTO public.project_templates (category, name, description, phases) VALUES 
('Consulting', 'Consulting & Advisory', 'Strategy, audits, training', '[
  {"name": "Assessment", "order": 1, "tasks": [
    {"title": "Information gathering & document review", "type": "Research", "priority": "High", "energy_level": "deep", "estimated_minutes": 180}
  ]},
  {"name": "Recommendations", "order": 2, "tasks": [
    {"title": "Develop findings & recommendations", "type": "Implementation", "priority": "Critical", "energy_level": "deep", "estimated_minutes": 300}
  ]},
  {"name": "Delivery", "order": 3, "tasks": [
    {"title": "Handover & documentation", "type": "Admin", "priority": "High", "energy_level": "shallow", "estimated_minutes": 60}
  ]}
]') ON CONFLICT (category) DO NOTHING;

INSERT INTO public.project_templates (category, name, description, phases) VALUES 
('Personal', 'Personal / Internal', 'Habits, learning, chores', '[
  {"name": "Do", "order": 1, "tasks": [
    {"title": "Define what done looks like", "type": "Planning", "priority": "High", "energy_level": "deep", "estimated_minutes": 30},
    {"title": "Break down into actionable tasks", "type": "Planning", "priority": "High", "energy_level": "deep", "estimated_minutes": 30}
  ]}
]') ON CONFLICT (category) DO NOTHING;
