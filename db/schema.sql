-- ══════════════════════════════════════════════════════════
-- RELAY DATABASE SCHEMA
-- Multi-tenant referral & event management system
-- ══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════
-- TENANTS (Organizations using the platform)
-- ══════════════════════════════════════════════════════════
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#818cf8',
  email_from_name TEXT DEFAULT 'Relay',
  email_from_address TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- USERS (People across all tenants)
-- ══════════════════════════════════════════════════════════
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  source TEXT DEFAULT 'organic',
  lead_quality_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- ══════════════════════════════════════════════════════════
-- EVENTS
-- ══════════════════════════════════════════════════════════
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  capacity INT,
  registration_deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'closed', 'completed')),
  referral_enabled BOOLEAN DEFAULT true,
  max_referral_depth INT DEFAULT 10,
  require_approval BOOLEAN DEFAULT false,
  credits_per_direct_referral INT DEFAULT 3,
  credits_per_indirect_referral INT DEFAULT 1,
  credits_per_attendance INT DEFAULT 5,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- REFERRAL LINKS
-- ══════════════════════════════════════════════════════════
CREATE TABLE referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES users(id),
  code TEXT UNIQUE NOT NULL,
  url_slug TEXT UNIQUE NOT NULL,
  click_count INT DEFAULT 0,
  registration_count INT DEFAULT 0,
  max_uses INT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, referrer_id)
);

-- ══════════════════════════════════════════════════════════
-- REGISTRATIONS
-- ══════════════════════════════════════════════════════════
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  referral_link_id UUID REFERENCES referral_links(id),
  referred_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'registered'
    CHECK (status IN ('registered', 'confirmed', 'attended', 'no_show', 'cancelled')),
  custom_fields JSONB DEFAULT '{}',
  registered_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

-- ══════════════════════════════════════════════════════════
-- REFERRAL CHAIN (Multi-level referral tracking)
-- ══════════════════════════════════════════════════════════
CREATE TABLE referral_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  referrer_id UUID NOT NULL REFERENCES users(id),
  depth INT NOT NULL,
  root_referrer_id UUID NOT NULL REFERENCES users(id),
  UNIQUE(event_id, user_id, referrer_id)
);

-- ══════════════════════════════════════════════════════════
-- CREDITS (Reward/point system)
-- ══════════════════════════════════════════════════════════
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  amount INT NOT NULL,
  reason TEXT NOT NULL
    CHECK (reason IN (
      'direct_referral', 'indirect_referral', 'attendance_bonus',
      'host_seed', 'milestone_bonus', 'manual_adjustment'
    )),
  triggered_by_registration UUID REFERENCES registrations(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- PERKS (Redeemable rewards for credits)
-- ══════════════════════════════════════════════════════════
CREATE TABLE perks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  credit_cost INT NOT NULL,
  quantity_available INT,
  quantity_claimed INT DEFAULT 0,
  perk_type TEXT NOT NULL
    CHECK (perk_type IN (
      'access', 'upgrade', 'recognition', 'swag', 'experience', 'priority'
    )),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- PERK CLAIMS (User redemptions)
-- ══════════════════════════════════════════════════════════
CREATE TABLE perk_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perk_id UUID NOT NULL REFERENCES perks(id),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  credits_spent INT NOT NULL,
  status TEXT DEFAULT 'claimed'
    CHECK (status IN ('claimed', 'fulfilled', 'expired', 'revoked')),
  claimed_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);

-- ══════════════════════════════════════════════════════════
-- LINK CLICKS (Detailed click tracking)
-- ══════════════════════════════════════════════════════════
CREATE TABLE link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id),
  ip_hash TEXT,
  user_agent TEXT,
  referer_url TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- INDEXES (Enhanced)
-- ══════════════════════════════════════════════════════════
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(tenant_id, email);
CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_status ON events(tenant_id, status);
CREATE INDEX idx_referral_links_code ON referral_links(code);
CREATE INDEX idx_referral_links_event ON referral_links(event_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_referrer ON registrations(referred_by);
CREATE INDEX idx_registrations_status ON registrations(event_id, status);
CREATE INDEX idx_chain_event_referrer ON referral_chain(event_id, referrer_id);
CREATE INDEX idx_chain_depth ON referral_chain(event_id, depth);
CREATE INDEX idx_credits_user ON credits(user_id);
CREATE INDEX idx_credits_event ON credits(event_id, user_id);
CREATE INDEX idx_clicks_link ON link_clicks(referral_link_id);
CREATE INDEX idx_clicks_time ON link_clicks(clicked_at);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX idx_perks_event ON perks(event_id);
CREATE INDEX idx_perk_claims_user ON perk_claims(user_id);
CREATE INDEX idx_perk_claims_event ON perk_claims(event_id);

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE perk_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS
CREATE POLICY "service_role_all_users" ON users
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_events" ON events
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_registrations" ON registrations
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_referral_links" ON referral_links
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_credits" ON credits
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_perks" ON perks
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_perk_claims" ON perk_claims
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_link_clicks" ON link_clicks
  FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════
-- FUNCTIONS
-- ══════════════════════════════════════════════════════════

-- Award credits for direct referral
CREATE OR REPLACE FUNCTION award_direct_referral_credits()
RETURNS TRIGGER AS $$
DECLARE
  v_event events%ROWTYPE;
  v_referrer_id UUID;
BEGIN
  -- Get event details
  SELECT * INTO v_event FROM events WHERE id = NEW.event_id;
  
  -- Get referrer from referral link
  SELECT referrer_id INTO v_referrer_id
  FROM referral_links WHERE id = NEW.referral_link_id;
  
  -- Award direct referral credits
  IF v_referrer_id IS NOT NULL AND v_event.credits_per_direct_referral > 0 THEN
    INSERT INTO credits (tenant_id, user_id, event_id, amount, reason, triggered_by_registration)
    VALUES (v_event.tenant_id, v_referrer_id, NEW.event_id, v_event.credits_per_direct_referral, 'direct_referral', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_direct_credits
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION award_direct_referral_credits();

-- Award credits for attendance
CREATE OR REPLACE FUNCTION award_attendance_credits()
RETURNS TRIGGER AS $$
DECLARE
  v_event events%ROWTYPE;
  v_referrer_id UUID;
BEGIN
  -- Only trigger when status changes to 'attended'
  IF NEW.status = 'attended' AND (OLD.status IS NULL OR OLD.status != 'attended') THEN
    -- Get event details
    SELECT * INTO v_event FROM events WHERE id = NEW.event_id;
    
    -- Get referrer from referral link
    SELECT referrer_id INTO v_referrer_id
    FROM referral_links WHERE id = NEW.referral_link_id;
    
    -- Award attendance credits to referrer
    IF v_referrer_id IS NOT NULL AND v_event.credits_per_attendance > 0 THEN
      INSERT INTO credits (tenant_id, user_id, event_id, amount, reason, triggered_by_registration)
      VALUES (v_event.tenant_id, v_referrer_id, NEW.event_id, v_event.credits_per_attendance, 'attendance_bonus', NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_attendance_credits
  AFTER UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION award_attendance_credits();

-- ══════════════════════════════════════════════════════════
-- SEED DATA (Sample tenant for testing)
-- ══════════════════════════════════════════════════════════
INSERT INTO tenants (name, slug, plan, email_from_name, email_from_address)
VALUES (
  'NexiumDigital',
  'nexium-digital',
  'pro',
  'NexiumDigital Events',
  'events@nexiumdigital.com'
) ON CONFLICT DO NOTHING;
