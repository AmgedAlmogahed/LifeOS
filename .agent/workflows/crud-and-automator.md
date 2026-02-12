---
description: CRUD Forms + Automator Engine Implementation Plan
---

# CRUD Forms + Automator Engine — Implementation Plan

## Overview

Three layers of work:
1. **Server Actions** — Reusable mutation functions (create/update/delete) per entity
2. **CRUD Form Components** — Modal dialogs for creating/editing entities
3. **Automator Engine** — Business rule triggers that chain actions automatically

---

## Phase 1: Server Actions (`src/lib/actions/`)

Create Next.js Server Actions for each entity. These call Supabase with the service-role or user client and `revalidatePath` to refresh the UI.

### Files to Create

| File | Actions |
|------|---------|
| `src/lib/actions/clients.ts` | `createClient`, `updateClient`, `deleteClient` |
| `src/lib/actions/opportunities.ts` | `createOpportunity`, `updateOpportunity`, `deleteOpportunity` |
| `src/lib/actions/price-offers.ts` | `createPriceOffer`, `updatePriceOffer` |
| `src/lib/actions/contracts.ts` | `createContract`, `updateContract` |
| `src/lib/actions/projects.ts` | `createProject`, `updateProject`, `deleteProject` |
| `src/lib/actions/deployments.ts` | `createDeployment`, `updateDeployment`, `deleteDeployment` |
| `src/lib/actions/automator.ts` | `onOfferAccepted`, `onContractActivated`, `onOpportunityWon` |

### Pattern
```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createXxx(formData: FormData) {
  const supabase = await createClient();
  const fields = Object.fromEntries(formData);
  // validate, insert, revalidate
  const { error } = await supabase.from("xxx").insert(fields);
  if (error) return { error: error.message };
  revalidatePath("/xxx");
  return { success: true };
}
```

---

## Phase 2: CRUD Modal Components

### Shared Modal Shell
Create `src/components/ui/modal.tsx` — a reusable glassmorphic dialog overlay using HTML `<dialog>` or state-controlled portal.

### Entity Modals

| Component | Location | Fields |
|-----------|----------|--------|
| `ClientForm` | `src/components/forms/client-form.tsx` | name*, email, phone, brand_primary, brand_secondary, brand_accent, logo_url, notes |
| `OpportunityForm` | `src/components/forms/opportunity-form.tsx` | client_id* (select), title*, description, service_type* (select), stage, estimated_value, probability, expected_close |
| `PriceOfferForm` | `src/components/forms/price-offer-form.tsx` | client_id* (select), opportunity_id (select), title*, items[] (dynamic line items), valid_until, notes |
| `ContractForm` | `src/components/forms/contract-form.tsx` | client_id*, opportunity_id, price_offer_id, title*, total_value, start_date, end_date, terms_md |
| `ProjectForm` | `src/components/forms/project-form.tsx` | name*, description, client_id, contract_id, service_type, specs_md |
| `DeploymentForm` | `src/components/forms/deployment-form.tsx` | project_id* (select), environment* (select), label*, url, status |

### Integration Points
- Clients page: "+ New Client" button → `ClientForm` modal
- Pipeline page: "+ Add Opportunity" button → `OpportunityForm` modal  
- Vault page: "+ New Offer/Contract" buttons → respective modals
- Forge page: "+ New Project" button → `ProjectForm` modal
- Deployments page: "+ Add Deployment" button → `DeploymentForm` modal
- Detail pages: "Edit" buttons → pre-filled modals in edit mode

---

## Phase 3: Automator Engine

### Triggers

| Trigger | When | Auto-Action |
|---------|------|-------------|
| **Offer Accepted → Draft Contract** | `price_offers.status` changes to `"Accepted"` | Create a draft `contract` copying `client_id`, `opportunity_id`, `price_offer_id`, `total_value`, `title` from the offer |
| **Opportunity Won → Init Project** | `opportunities.stage` changes to `"Won"` | Create a `project` with `client_id`, `service_type`, `name = opportunity.title`, status `"Understand"`, and a `lifecycle` record |
| **Contract Activated → Audit Log** | `contracts.status` changes to `"Active"` | Insert `audit_log` entry with level `"Info"` and a congratulatory message |

### Implementation
The automator runs inside the server actions, not as background triggers. When a user or agent updates an entity, the action checks if a trigger condition is met and fires the chained action.

```
updatePriceOffer(id, { status: "Accepted" })
  → if new status === "Accepted": await autoCreateDraftContract(offer)
  → audit_log: "Automator: Contract drafted for {client}"

updateOpportunity(id, { stage: "Won" })  
  → if new stage === "Won": await autoInitProject(opportunity)
  → audit_log: "Automator: Project initialized from {opportunity}"
```

### Audit Trail
Every automator action logs to `audit_logs` with source `"automator"` so the Guardian Feed shows automated actions.

---

## Phase 4: Wire Up to Existing Pages

1. Add `+ New Client` button to `clients-client.tsx` header → opens `ClientForm`
2. Add `+ Opportunity` button to `pipeline-client.tsx` header → opens `OpportunityForm`
3. Add `+ Offer` / `+ Contract` buttons to `vault-client.tsx` → opens respective forms
4. Add `+ Project` button to `forge-client.tsx` → opens `ProjectForm`
5. Add `+ Deployment` button to `deployments-client.tsx` → opens `DeploymentForm`
6. Add inline edit/delete actions on list items and detail pages

---

## Execution Order

1. Create `src/components/ui/modal.tsx` (shared dialog)
2. Create all server actions in `src/lib/actions/`
3. Create all form components in `src/components/forms/`
4. Create `src/lib/actions/automator.ts` (business rule engine)
5. Update list pages to include create buttons + modals
6. Update detail pages with edit/delete buttons
7. Build verification
