-- Add role-based access and campaign system for Relay-it App
-- Migration 002: Add roles, campaigns, contacts, relay tokens

-- Step 1: Add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user'));

-- Step 2: Create campaigns table (replaces basic events for email campaigns)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  event_location TEXT,
  event_url TEXT,
  
  -- AI generation inputs
  target_audience TEXT,
  key_benefits TEXT,
  call_to_action TEXT,
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'casual', 'urgent', 'friendly', 'formal')),
  
  -- Generated email content
  email_subject TEXT,
  email_body TEXT,
  
  -- Campaign status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create contacts table (tracks all contacts for each campaign)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  
  -- Contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Relay chain tracking
  referred_by_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  relay_depth INTEGER DEFAULT 0, -- 0 = initial contact, 1 = first relay, etc.
  
  -- Status tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  has_relayed BOOLEAN DEFAULT false,
  relay_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, email)
);

-- Step 4: Create relay_tokens table (for public relay links)
CREATE TABLE IF NOT EXISTS public.relay_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT SUBSTRING(MD5(RANDOM()::TEXT) || MD5(RANDOM()::TEXT), 1, 32),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  
  -- Token status
  is_active BOOLEAN DEFAULT true,
  used_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Step 5: Create email_logs table (track all sent emails)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  
  -- Email details
  from_name TEXT,
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  resend_id TEXT, -- Resend email ID for tracking
  error_message TEXT,
  
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Enable RLS on new tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Step 8: Campaigns RLS Policies
-- Admins can do everything
CREATE POLICY "campaigns_admin_all" ON public.campaigns 
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Managers can create and manage their own campaigns
CREATE POLICY "campaigns_manager_select" ON public.campaigns 
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('manager', 'user') 
    AND (created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
  );

CREATE POLICY "campaigns_manager_insert" ON public.campaigns 
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'manager')
    AND created_by = auth.uid()
  );

CREATE POLICY "campaigns_manager_update" ON public.campaigns 
  FOR UPDATE USING (
    created_by = auth.uid() 
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "campaigns_manager_delete" ON public.campaigns 
  FOR DELETE USING (
    created_by = auth.uid() 
    OR public.get_user_role(auth.uid()) = 'admin'
  );

-- Step 9: Contacts RLS Policies
-- Admins see all contacts
CREATE POLICY "contacts_admin_all" ON public.contacts 
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Managers see contacts for their campaigns
CREATE POLICY "contacts_manager_select" ON public.contacts 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = contacts.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "contacts_manager_insert" ON public.contacts 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = contacts.campaign_id 
      AND (campaigns.created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "contacts_manager_update" ON public.contacts 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = contacts.campaign_id 
      AND (campaigns.created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
  );

-- Public insert for relay (no auth required) - handled via service role in API

-- Step 10: Relay Tokens RLS Policies
CREATE POLICY "relay_tokens_admin_all" ON public.relay_tokens 
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "relay_tokens_manager_select" ON public.relay_tokens 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = relay_tokens.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "relay_tokens_manager_insert" ON public.relay_tokens 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = relay_tokens.campaign_id 
      AND (campaigns.created_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
  );

-- Step 11: Email Logs RLS Policies
CREATE POLICY "email_logs_admin_all" ON public.email_logs 
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "email_logs_manager_select" ON public.email_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = email_logs.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  );

-- Step 12: Update profiles trigger to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(profiles.role, 'user');
  RETURN NEW;
END;
$$;

-- Step 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_contacts_campaign_id ON public.contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_referred_by ON public.contacts(referred_by_contact_id);
CREATE INDEX IF NOT EXISTS idx_relay_tokens_token ON public.relay_tokens(token);
CREATE INDEX IF NOT EXISTS idx_relay_tokens_contact_id ON public.relay_tokens(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON public.email_logs(campaign_id);
