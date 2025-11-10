# Self-Hosted Supabase Authentication Fix Guide

## Problem
- Cannot update Auth settings in Supabase Studio
- Error: "Failed to update auth configuration: API error"
- SQL errors: `relation "auth.providers" does not exist` and `relation "auth.config" does not exist`

## Root Cause
Self-hosted Supabase configures Auth via **environment variables**, not SQL tables like Supabase Cloud.

---

## Step 1: Verify Database State

Run these SQL queries in your Supabase SQL Editor to check your database:

```sql
-- Check if auth schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Check what tables exist in auth schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
ORDER BY table_name;

-- Verify auth.users table exists (core table)
SELECT COUNT(*) as user_count 
FROM auth.users;
```

**Expected Result:** 
- `auth` schema should exist
- Tables like `users`, `identities`, `refresh_tokens` should exist
- `auth.config` and `auth.providers` tables will NOT exist (this is normal for self-hosted)

---

## Step 2: Fix Auth Configuration via Docker Compose

### Location
SSH into your VPS and locate your `docker-compose.yml` file:
```bash
cd /path/to/your/supabase/
nano docker-compose.yml
```

### Update `auth` Service

Find the `auth` service (or `supabase-auth`) and add/update these environment variables:

```yaml
auth:
  image: supabase/gotrue:v2.151.0
  environment:
    # Site URL (your app's public URL)
    GOTRUE_SITE_URL: "https://your-app-domain.com"
    
    # Allow list for redirects
    GOTRUE_URI_ALLOW_LIST: "https://your-app-domain.com/*,http://localhost:3000/*"
    
    # ✅ DISABLE EMAIL CONFIRMATION
    GOTRUE_MAILER_AUTOCONFIRM: "true"
    
    # ✅ ENABLE GOOGLE OAUTH
    GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"
    GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID_HERE"
    GOTRUE_EXTERNAL_GOOGLE_SECRET: "YOUR_GOOGLE_CLIENT_SECRET_HERE"
    GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: "https://supabase.aiagentra.com/auth/v1/callback"
    
    # Operator Token (create a long random string)
    GOTRUE_OPERATOR_TOKEN: "your-super-secret-operator-token-min-32-chars"
    
    # Database connection
    GOTRUE_DB_DATABASE_URL: "postgresql://postgres:your-db-password@db:5432/postgres"
    
    # JWT Settings
    GOTRUE_JWT_SECRET: "your-jwt-secret"
    GOTRUE_JWT_EXP: "3600"
    
    # API settings
    API_EXTERNAL_URL: "https://supabase.aiagentra.com"
```

### Update `studio` Service

Find the `studio` service and add/update:

```yaml
studio:
  image: supabase/studio:latest
  environment:
    # Studio API settings
    STUDIO_DEFAULT_API_URL: "https://supabase.aiagentra.com"
    STUDIO_DEFAULT_AUTH_DOMAIN: "supabase.aiagentra.com"
    
    # ⚠️ CRITICAL: Must match GOTRUE_OPERATOR_TOKEN exactly
    STUDIO_OPERATOR_TOKEN: "your-super-secret-operator-token-min-32-chars"
    
    SUPABASE_URL: "https://supabase.aiagentra.com"
    SUPABASE_PUBLIC_URL: "https://supabase.aiagentra.com"
```

### Update `kong` Service

Find the `kong` service and verify:

```yaml
kong:
  image: kong:2.8
  environment:
    KONG_DATABASE: "off"
    KONG_DECLARATIVE_CONFIG: "/var/lib/kong/kong.yml"
    KONG_DNS_ORDER: "LAST,A,CNAME"
    KONG_PLUGINS: "request-transformer,cors,key-auth,acl"
    
    # ⚠️ IMPORTANT: Must match your public URL
    API_EXTERNAL_URL: "https://supabase.aiagentra.com"
```

---

## Step 3: Generate Operator Token

Run this command to generate a secure operator token:

```bash
openssl rand -base64 48
```

Copy the output and use it for both `GOTRUE_OPERATOR_TOKEN` and `STUDIO_OPERATOR_TOKEN`.

---

## Step 4: Restart Services

After updating `docker-compose.yml`:

```bash
# Restart only the affected services
docker compose up -d auth studio kong

# Or restart everything
docker compose down
docker compose up -d

# Check service logs
docker logs supabase-auth --tail=50 -f
docker logs supabase-studio --tail=50 -f
docker logs supabase-kong --tail=50 -f
```

---

## Step 5: Verify Configuration

### Test Auth Health
```bash
curl https://supabase.aiagentra.com/auth/v1/health
```

**Expected:** `{"version":"...","name":"GoTrue"}`

### Test Admin Settings
```bash
curl -X GET 'https://supabase.aiagentra.com/auth/v1/settings' \
  -H 'Authorization: Bearer YOUR_OPERATOR_TOKEN_HERE'
```

**Expected:** JSON response with `external.google.enabled: true` and `mailer.autoconfirm: true`

---

## Step 6: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Choose **Web application**
6. Add **Authorized JavaScript origins**:
   - `https://supabase.aiagentra.com`
   - `http://localhost:3000` (for testing)
7. Add **Authorized redirect URIs**:
   - `https://supabase.aiagentra.com/auth/v1/callback`
   - `http://localhost:3000/auth/v1/callback` (for testing)
8. Copy the **Client ID** and **Client Secret**
9. Paste them into your `docker-compose.yml` as shown in Step 2

---

## Step 7: Optional SQL Helpers

These scripts safely update auth tables if they exist, but won't error if they don't:

### Safe Email Confirmation Disable
```sql
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'config'
  ) THEN
    UPDATE auth.config 
    SET enable_email_confirmations = false 
    WHERE id = 1;
    RAISE NOTICE 'Email confirmation disabled via SQL';
  ELSE
    RAISE NOTICE 'auth.config table not found - use environment variables instead';
  END IF;
END $$;
```

### Safe Google Provider Insert
```sql
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'providers'
  ) THEN
    INSERT INTO auth.providers (
      id, provider, enabled, client_id, secret, redirect_uri
    ) VALUES (
      gen_random_uuid(),
      'google',
      true,
      'YOUR_GOOGLE_CLIENT_ID',
      'YOUR_GOOGLE_CLIENT_SECRET',
      'https://supabase.aiagentra.com/auth/v1/callback'
    )
    ON CONFLICT (provider) DO UPDATE SET
      enabled = true,
      client_id = EXCLUDED.client_id,
      secret = EXCLUDED.secret,
      redirect_uri = EXCLUDED.redirect_uri;
    RAISE NOTICE 'Google provider configured via SQL';
  ELSE
    RAISE NOTICE 'auth.providers table not found - use environment variables instead';
  END IF;
END $$;
```

---

## Troubleshooting

### Studio still shows error
1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Check operator tokens match** in both auth and studio services
3. **Verify kong is routing correctly**: `docker logs supabase-kong`

### Google Sign-In not working
1. **Check redirect URIs match** in Google Console and docker-compose
2. **Verify client ID/secret** are correct
3. **Check auth logs**: `docker logs supabase-auth | grep google`

### Users can't sign up
1. **Confirm GOTRUE_MAILER_AUTOCONFIRM is "true"** (string, not boolean)
2. **Check GOTRUE_SITE_URL matches** your actual app URL
3. **Verify database is writable**: Check auth.users table permissions

---

## Success Checklist

- ✅ Auth health endpoint returns 200
- ✅ Admin settings endpoint shows correct config
- ✅ Studio loads without errors
- ✅ Can create new user without email confirmation
- ✅ Google Sign-In button appears in Studio
- ✅ Can authenticate with Google

---

## Need Help?

If you continue experiencing issues:
1. Share the output of the SQL diagnostics from Step 1
2. Share relevant logs from `docker logs supabase-auth`
3. Confirm your Docker Compose version: `docker compose version`
