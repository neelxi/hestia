-- Fictional Summit Realty dataset for the HWA demo.
-- Safe to rerun: every row uses a deterministic ID and is upserted.

update public.workspace
set
  name = 'Summit Realty Demo',
  type = 'brokerage',
  template_id = 'brokerage',
  settings = settings || '{"demo":true,"market":"Greater Boston"}'::jsonb,
  updated_at = now();

insert into public.teams (id, name, description)
values
  ('c368ebc1-eb7a-5787-b61b-385dbf457d85', 'Residential Growth', 'High-velocity residential sales team'),
  ('fbfeca2c-bb7c-5698-9a4a-dd393d6d2aa4', 'Luxury & Waterfront', 'Premium listings and buyer representation')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

insert into public.agents (
  id, first_name, last_name, email, phone, license_number, license_expiry,
  eo_policy_expiry, team_id, status, external_id, metadata
)
values
  (
    '0f2b11f9-5a97-5579-81c1-0843551e5da0', 'Maya', 'Chen',
    'maya.chen@demo.hestiaops.com', '617-555-0101', 'MA-RE-10428', current_date + 310,
    current_date + 220, 'fbfeca2c-bb7c-5698-9a4a-dd393d6d2aa4', 'active',
    'HWA-DEMO-AGENT-01', '{"demo":true,"ytd_volume":6800000}'
  ),
  (
    '2986147b-8fcb-58e1-9c60-9e32ed359361', 'Jordan', 'Blake',
    'jordan.blake@demo.hestiaops.com', '617-555-0102', 'MA-RE-11803', current_date + 185,
    current_date + 28, 'c368ebc1-eb7a-5787-b61b-385dbf457d85', 'active',
    'HWA-DEMO-AGENT-02', '{"demo":true,"ytd_volume":4200000}'
  ),
  (
    'f8e3bc80-a6ba-5e78-b895-14141dcb0067', 'Sofia', 'Martinez',
    'sofia.martinez@demo.hestiaops.com', '617-555-0103', 'MA-RE-12177', current_date + 24,
    current_date + 170, 'c368ebc1-eb7a-5787-b61b-385dbf457d85', 'active',
    'HWA-DEMO-AGENT-03', '{"demo":true,"ytd_volume":3550000}'
  ),
  (
    '9d25a47b-a99e-50c6-a277-2a229e1b909f', 'Ethan', 'Brooks',
    'ethan.brooks@demo.hestiaops.com', '617-555-0104', 'MA-RE-09552', current_date + 260,
    current_date + 260, 'fbfeca2c-bb7c-5698-9a4a-dd393d6d2aa4', 'active',
    'HWA-DEMO-AGENT-04', '{"demo":true,"ytd_volume":8100000}'
  ),
  (
    '4e60c59f-9a37-55d4-949f-83be070c8ee3', 'Ava', 'Patel',
    'ava.patel@demo.hestiaops.com', '617-555-0105', 'MA-RE-13001', current_date + 350,
    current_date + 350, 'c368ebc1-eb7a-5787-b61b-385dbf457d85', 'pending',
    'HWA-DEMO-AGENT-05', '{"demo":true,"onboarding_stage":"orientation"}'
  )
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  phone = excluded.phone,
  license_number = excluded.license_number,
  license_expiry = excluded.license_expiry,
  eo_policy_expiry = excluded.eo_policy_expiry,
  team_id = excluded.team_id,
  status = excluded.status,
  external_id = excluded.external_id,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.transactions (
  id, address, list_price, status, type, listing_agent_id, buyer_agent_id,
  closing_date, contingency_date, inspection_deadline, external_id, metadata
)
values
  (
    '17625a5d-338c-5fce-a66a-2f376f9bbc84', '18 Willow Street, Cambridge, MA',
    875000, 'active', 'Listing', '0f2b11f9-5a97-5579-81c1-0843551e5da0', null,
    current_date + 21, current_date + 7, now() + interval '4 days',
    'HWA-DEMO-TX-01', '{"demo":true,"source":"Referral"}'
  ),
  (
    '3ef4b3b6-86fc-5de8-83a9-1099c6c7e4f3', '742 Lakeview Avenue, Newton, MA',
    1245000, 'pending_close', 'Buyer representation', null, '2986147b-8fcb-58e1-9c60-9e32ed359361',
    current_date + 7, current_date - 3, null,
    'HWA-DEMO-TX-02', '{"demo":true,"lender":"Harbor Lending"}'
  ),
  (
    '6ebf5744-1ac1-573e-9ed3-3927a363c07f', '91 Harbor Way, Boston, MA',
    2380000, 'active', 'Dual-sided', '9d25a47b-a99e-50c6-a277-2a229e1b909f', '0f2b11f9-5a97-5579-81c1-0843551e5da0',
    current_date + 45, current_date + 18, null,
    'HWA-DEMO-TX-03', '{"demo":true,"tier":"luxury"}'
  ),
  (
    '1f5f9bcb-e65b-5a08-a36b-48ba18a2e163', '305 Maple Road, Brookline, MA',
    715000, 'pending', 'Listing', 'f8e3bc80-a6ba-5e78-b895-14141dcb0067', null,
    current_date + 60, null, null,
    'HWA-DEMO-TX-04', '{"demo":true,"stage":"documents_out"}'
  ),
  (
    '03d31fd0-c52e-5d68-8f19-cb48ef7f381d', '126 Crest Lane, Somerville, MA',
    690000, 'closed', 'Buyer representation', null, 'f8e3bc80-a6ba-5e78-b895-14141dcb0067',
    current_date - 10, null, null,
    'HWA-DEMO-TX-05', '{"demo":true,"sold_price":705000}'
  )
on conflict (id) do update set
  address = excluded.address,
  list_price = excluded.list_price,
  status = excluded.status,
  type = excluded.type,
  listing_agent_id = excluded.listing_agent_id,
  buyer_agent_id = excluded.buyer_agent_id,
  closing_date = excluded.closing_date,
  contingency_date = excluded.contingency_date,
  inspection_deadline = excluded.inspection_deadline,
  external_id = excluded.external_id,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.sops (id, title, content, category, is_automated, trigger_conditions)
values (
  'c41189d1-ee77-5d63-af49-5d52b6b8b8d4',
  'Closing compliance review',
  'Verify signatures, financing, inspection, title, commission, and archival requirements before close.',
  'compliance', true, '{"transaction_status":"pending_close"}'
)
on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  category = excluded.category,
  is_automated = excluded.is_automated,
  trigger_conditions = excluded.trigger_conditions,
  updated_at = now();

insert into public.workflows (id, name, description, sop_id)
values (
  '327a1dba-87d8-5372-8fd0-dd17c19dc1ee',
  'Contract-to-close',
  'Coordinates deadlines and compliance from executed offer through disbursement.',
  'c41189d1-ee77-5d63-af49-5d52b6b8b8d4'
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sop_id = excluded.sop_id,
  updated_at = now();

insert into public.tasks (
  id, title, description, status, priority, due_date, transaction_id, workflow_id
)
values
  ('c44ba150-f596-5e7c-aaee-5063a274c084', 'Confirm inspection response', 'Demo task generated from the contract-to-close workflow.', 'in_progress', 'urgent', current_date - 1, '17625a5d-338c-5fce-a66a-2f376f9bbc84', '327a1dba-87d8-5372-8fd0-dd17c19dc1ee'),
  ('fa2bddc7-edd0-5c99-a25c-450e631ad38d', 'Verify closing wire instructions', 'Demo task generated from the contract-to-close workflow.', 'compliance_review', 'urgent', current_date + 2, '3ef4b3b6-86fc-5de8-83a9-1099c6c7e4f3', '327a1dba-87d8-5372-8fd0-dd17c19dc1ee'),
  ('a9f9b2d7-5341-5f5c-aac0-3ce15a355066', 'Review title commitment', 'Demo task generated from the contract-to-close workflow.', 'todo', 'high', current_date + 3, '3ef4b3b6-86fc-5de8-83a9-1099c6c7e4f3', '327a1dba-87d8-5372-8fd0-dd17c19dc1ee'),
  ('7c0fd638-483b-552b-8989-ca1bd5f5b13e', 'Collect signed seller disclosures', 'Demo task generated from the contract-to-close workflow.', 'todo', 'high', current_date + 5, '1f5f9bcb-e65b-5a08-a36b-48ba18a2e163', '327a1dba-87d8-5372-8fd0-dd17c19dc1ee'),
  ('4d349bf8-9982-59d4-828f-b53b02d275a4', 'Schedule listing photography', 'Demo task generated from the contract-to-close workflow.', 'in_progress', 'medium', current_date + 8, '1f5f9bcb-e65b-5a08-a36b-48ba18a2e163', '327a1dba-87d8-5372-8fd0-dd17c19dc1ee'),
  ('8dfc38a7-5bfc-5563-ba95-03b5cdd9155d', 'Confirm earnest-money receipt', 'Demo task generated from the contract-to-close workflow.', 'done', 'high', current_date - 4, '17625a5d-338c-5fce-a66a-2f376f9bbc84', '327a1dba-87d8-5372-8fd0-dd17c19dc1ee'),
  ('802e8dbb-4293-553d-8f39-b91f08c1b027', 'Approve luxury marketing package', 'Demo task generated from the contract-to-close workflow.', 'todo', 'medium', current_date + 12, '6ebf5744-1ac1-573e-9ed3-3927a363c07f', '327a1dba-87d8-5372-8fd0-dd17c19dc1ee'),
  ('89abb6bf-8d65-591c-b267-cdf831e43677', 'Archive final closing package', 'Demo task generated from the contract-to-close workflow.', 'done', 'low', current_date - 7, '03d31fd0-c52e-5d68-8f19-cb48ef7f381d', '327a1dba-87d8-5372-8fd0-dd17c19dc1ee')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  priority = excluded.priority,
  due_date = excluded.due_date,
  transaction_id = excluded.transaction_id,
  workflow_id = excluded.workflow_id,
  updated_at = now();

insert into public.commissions (
  id, agent_id, transaction_id, split_percent, cap_amount, cap_progress,
  amount, status, disbursement_at, metadata
)
values
  ('68d55bd3-02b2-50b8-b202-f3ff0c48a4ec', '0f2b11f9-5a97-5579-81c1-0843551e5da0', '17625a5d-338c-5fce-a66a-2f376f9bbc84', 80, 18000, 12600, 17500, 'pending', null, '{"demo":true}'),
  ('8c9dbf94-ea51-5d5f-9e08-cbc964224278', '2986147b-8fcb-58e1-9c60-9e32ed359361', '3ef4b3b6-86fc-5de8-83a9-1099c6c7e4f3', 75, 18000, 9800, 23343.75, 'approved', null, '{"demo":true}'),
  ('ab05818e-7e51-5c51-a5b6-18f16499b5df', '9d25a47b-a99e-50c6-a277-2a229e1b909f', '6ebf5744-1ac1-573e-9ed3-3927a363c07f', 85, 20000, 20000, 50575, 'pending', null, '{"demo":true}'),
  ('6dc3c199-8a94-52b3-a64e-f469fac16c8e', 'f8e3bc80-a6ba-5e78-b895-14141dcb0067', '03d31fd0-c52e-5d68-8f19-cb48ef7f381d', 70, 18000, 6300, 12337.50, 'paid', now() - interval '2 days', '{"demo":true}'),
  ('f60b4933-b1cb-52d5-aca4-31be56c4d9b9', '0f2b11f9-5a97-5579-81c1-0843551e5da0', '6ebf5744-1ac1-573e-9ed3-3927a363c07f', 80, null, null, 47600, 'disputed', null, '{"demo":true,"reason":"Referral fee verification"}')
on conflict (id) do update set
  agent_id = excluded.agent_id,
  transaction_id = excluded.transaction_id,
  split_percent = excluded.split_percent,
  cap_amount = excluded.cap_amount,
  cap_progress = excluded.cap_progress,
  amount = excluded.amount,
  status = excluded.status,
  disbursement_at = excluded.disbursement_at,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.compliance_records (id, agent_id, type, status, expiry_at, metadata)
values
  ('c95b51ca-0675-5ac0-a11e-15b0d3981a62', 'f8e3bc80-a6ba-5e78-b895-14141dcb0067', 'real_estate_license', 'expiring_soon', current_date + 24, '{"demo":true,"reminder_sent":true}'),
  ('7befcc9a-ba29-5c35-96b0-7daa3235acef', '2986147b-8fcb-58e1-9c60-9e32ed359361', 'errors_and_omissions', 'expiring_soon', current_date + 28, '{"demo":true,"reminder_sent":false}')
on conflict (id) do update set
  agent_id = excluded.agent_id,
  type = excluded.type,
  status = excluded.status,
  expiry_at = excluded.expiry_at,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.activity_log (
  id, action, entity_type, entity_id, actor_type, details, created_at
)
values
  ('e671138e-e0ce-547a-9bd4-0866772838f1', 'Created closing checklist from SOP', 'transaction', '3ef4b3b6-86fc-5de8-83a9-1099c6c7e4f3', 'mcp-agent', '{"demo":true}', now() - interval '1 hour'),
  ('71746371-9fce-5701-9d3f-0a5b15ed998e', 'Approved Jordan Blake commission', 'transaction', '3ef4b3b6-86fc-5de8-83a9-1099c6c7e4f3', 'user', '{"demo":true}', now() - interval '3 hours'),
  ('4df83c75-3168-5841-8f54-6c40b8d50898', 'Flagged Sofia Martinez license renewal', 'agent', 'f8e3bc80-a6ba-5e78-b895-14141dcb0067', 'system', '{"demo":true}', now() - interval '6 hours'),
  ('03eb203c-4fd3-57aa-be46-d465042b48aa', 'Updated inspection deadline', 'transaction', '17625a5d-338c-5fce-a66a-2f376f9bbc84', 'user', '{"demo":true}', now() - interval '9 hours'),
  ('82433367-0cb1-5f7b-941c-30fcfaba566a', 'Started Ava Patel onboarding', 'agent', '4e60c59f-9a37-55d4-949f-83be070c8ee3', 'mcp-agent', '{"demo":true}', now() - interval '14 hours'),
  ('b91501cd-6727-5d4e-b0c3-bf281f4b0366', 'Archived completed closing package', 'transaction', '03d31fd0-c52e-5d68-8f19-cb48ef7f381d', 'system', '{"demo":true}', now() - interval '28 hours')
on conflict (id) do update set
  action = excluded.action,
  entity_type = excluded.entity_type,
  entity_id = excluded.entity_id,
  actor_type = excluded.actor_type,
  details = excluded.details,
  created_at = excluded.created_at;

insert into public.settings (key, value)
values ('hwa_demo', jsonb_build_object('ready', true, 'seeded_at', now()))
on conflict (key) do update set value = excluded.value, updated_at = now();
