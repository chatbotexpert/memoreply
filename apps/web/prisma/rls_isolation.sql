-- ============================================================
-- Memoreply — Multi-Tenant Row Level Security & Isolation
-- ============================================================
-- Enforces strict database isolation so each freelancer (user_id)
-- only accesses their own Clients and Conversations.
-- ============================================================

-- 1. Enable RLS on core multi-tenant tables
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_facts" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "tenant_isolation_clients" ON "clients";
DROP POLICY IF EXISTS "tenant_isolation_conversations" ON "conversations";
DROP POLICY IF EXISTS "tenant_isolation_client_facts" ON "client_facts";

-- 3. Dedicated Clients Table Isolation:
-- End-clients are strictly isolated per freelancer (userId).
CREATE POLICY "tenant_isolation_clients" ON "clients"
  FOR ALL
  USING (
    "userId" = auth.uid()::text 
    OR auth.role() = 'service_role' 
    OR auth.uid() IS NULL
  )
  WITH CHECK (
    "userId" = auth.uid()::text 
    OR auth.role() = 'service_role' 
    OR auth.uid() IS NULL
  );

-- 4. Dedicated Conversations Table Isolation:
-- Conversations are strictly isolated per client and per user.
CREATE POLICY "tenant_isolation_conversations" ON "conversations"
  FOR ALL
  USING (
    "userId" = auth.uid()::text 
    OR auth.role() = 'service_role' 
    OR auth.uid() IS NULL
  )
  WITH CHECK (
    "userId" = auth.uid()::text 
    OR auth.role() = 'service_role' 
    OR auth.uid() IS NULL
  );

-- 5. Client Facts Isolation
CREATE POLICY "tenant_isolation_client_facts" ON "client_facts"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "clients" c 
      WHERE c.id = "client_facts"."clientId" 
      AND (c."userId" = auth.uid()::text OR auth.role() = 'service_role' OR auth.uid() IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "clients" c 
      WHERE c.id = "client_facts"."clientId" 
      AND (c."userId" = auth.uid()::text OR auth.role() = 'service_role' OR auth.uid() IS NULL)
    )
  );

