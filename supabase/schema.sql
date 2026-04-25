-- Relay-it App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_url TEXT,
  call_to_action TEXT DEFAULT 'Learn More',
  relay_message TEXT DEFAULT 'Know someone who would love this? Share it with them!',
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact lists table
CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  contact_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table (Relay-it version)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cellphone TEXT,
  list_id UUID REFERENCES contact_lists(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  relay_depth INTEGER DEFAULT 0,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  has_relayed BOOLEAN DEFAULT FALSE,
  relay_count INTEGER DEFAULT 0,
  referral_token TEXT UNIQUE DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral links table
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  token TEXT UNIQUE DEFAULT uuid_generate_v4(),
  click_count INTEGER DEFAULT 0,
  registration_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link clicks tracking
CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_link_id UUID REFERENCES referral_links(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  referer_url TEXT,
  device_type TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits/Rewards system
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  contact_id UUID REFERENCES contacts(id),
  campaign_id UUID REFERENCES campaigns(id),
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Perks/Rewards catalog
CREATE TABLE IF NOT EXISTS perks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  credit_cost INTEGER NOT NULL,
  quantity_available INTEGER,
  quantity_claimed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Perk claims
CREATE TABLE IF NOT EXISTS perk_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perk_id UUID REFERENCES perks(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  referral_code TEXT UNIQUE DEFAULT uuid_generate_v4(),
  total_referrals INTEGER DEFAULT 0,
  total_credits INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_list_id ON contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_contacts_campaign_id ON contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contacts_referral_token ON contacts(referral_token);
CREATE INDEX IF NOT EXISTS idx_referral_links_token ON referral_links(token);
CREATE INDEX IF NOT EXISTS idx_referral_links_contact_id ON referral_links(contact_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_referral_link_id ON link_clicks(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_contact_id ON credits(contact_id);
CREATE INDEX IF NOT EXISTS idx_perks_campaign_id ON perks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_perk_claims_perk_id ON perk_claims(perk_id);
CREATE INDEX IF NOT EXISTS idx_perk_claims_contact_id ON perk_claims(contact_id);

-- Enable Row Level Security (RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE perk_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all" ON campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON contact_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON referral_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON link_clicks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON credits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON perks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON perk_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_lists_updated_at BEFORE UPDATE ON contact_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
