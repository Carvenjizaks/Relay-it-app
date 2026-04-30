-- Migration 003: Sender Identities for Lawful Referral Relay
-- Stores encrypted SMTP credentials so relay emails can truly come from the sender

CREATE TABLE IF NOT EXISTS public.sender_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password_encrypted TEXT,
  smtp_secure BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, email)
);

-- Enable RLS
ALTER TABLE public.sender_identities ENABLE ROW LEVEL SECURITY;

-- Admin can see all
CREATE POLICY "sender_identities_admin_all" ON public.sender_identities 
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Campaign owners can see sender identities for contacts in their campaigns
CREATE POLICY "sender_identities_manager_select" ON public.sender_identities 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contacts 
      JOIN public.campaigns ON campaigns.id = contacts.campaign_id
      WHERE contacts.id = sender_identities.contact_id
      AND campaigns.created_by = auth.uid()
    )
  );

-- No direct insert/update/delete from client — managed via server API
