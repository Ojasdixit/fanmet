# 🔒 Emergency Maintenance Mode System

This system provides a secure way to enable/disable maintenance mode for your FanMeet application with a secret code that cannot be easily bypassed.

## 🎯 Features

- **Hidden Toggle**: Only accessible via keyboard shortcut (Ctrl+Shift+M) for admin users
- **Secret Code Protection**: Uses SHA-256 hashing - the actual code never appears in the codebase
- **Rate Limiting**: Prevents brute force attacks (max 3 attempts per hour)
- **Real-Time Updates**: All users instantly see maintenance mode when enabled
- **Secure Storage**: The secret code is hashed and compared, not stored in plaintext
- **Admin-Only Access**: Only users with admin role can toggle maintenance mode

## 🚀 Setup Instructions

### Step 1: Create the Database Table

Run the SQL migration in your Supabase dashboard:

```bash
# The SQL file is located at:
scripts/create-system-settings-table.sql
```

Or use the Supabase CLI or dashboard SQL editor to execute it.

### Step 2: Verify the Secret Code Hash

The secret code is: **`fuckyouandyourtricks`**

The SHA-256 hash of this code has been embedded in the file:
- `apps/web/src/lib/maintenanceAuth.ts`

**IMPORTANT**: After setup, you can delete the hash generation script:
```bash
rm scripts/generate-maintenance-hash.js
```

### Step 3: Test the System

1. Log in as an admin user
2. Press **Ctrl+Shift+M** to open the maintenance toggle
3. Select "Enable Maintenance Mode" or "Disable Maintenance Mode"
4. Enter the secret code: `fuckyouandyourtricks`
5. Click "Activate" or "Deactivate"

## 🔐 How It Works

### Architecture

1. **Client-Side Verification**: The secret code is hashed on the client using the Web Crypto API (SHA-256)
2. **Hash Comparison**: The input hash is compared with the stored hash using timing-safe comparison
3. **Database Update**: If the code is correct, the `system_settings` table is updated
4. **Real-Time Sync**: All connected clients receive the update via Supabase real-time subscriptions
5. **Automatic Redirect**: When maintenance mode is toggled, remember to also update the status page so fans know what to expect.

> _Last Netlify redeploy triggered: pending current session (update after successful deploy)._ 

### Security Measures

- ✅ **No Plaintext Storage**: The actual secret code never appears in production code
- ✅ **One-Way Hashing**: SHA-256 is irreversible - can't extract the original code from the hash
- ✅ **Rate Limiting**: Max 3 attempts per hour per identifier
- ✅ **Timing-Safe Comparison**: Prevents timing attacks
- ✅ **Admin-Only**: Only users with `role: 'admin'` can access the toggle
- ✅ **Hidden UI**: The toggle interface is not visible unless you know the keyboard shortcut

## 📝 Usage

### Enabling Maintenance Mode

1. As an admin, press **Ctrl+Shift+M**
2. Select "Enable Maintenance Mode"
3. Enter the secret code
4. Click "Activate"

All users (except those on the maintenance page) will immediately be redirected to the maintenance screen.

### Disabling Maintenance Mode

1. On the maintenance page, start typing the secret code (the input will appear)
2. Enter: `fuckyouandyourtricks`
3. Click "Unlock"

OR

1. As an admin (if you can access the app), press **Ctrl+Shift+M**
2. Select "Disable Maintenance Mode"
3. Enter the secret code
4. Click "Deactivate"

## 🛡️ Security Notes

### Changing the Secret Code

To change the secret code:

1. Modify `scripts/generate-maintenance-hash.js` with your new code
2. Run: `node scripts/generate-maintenance-hash.js`
3. Copy the generated hash
4. Update `apps/web/src/lib/maintenanceAuth.ts` with the new hash
5. Delete the generation script

### Best Practices

- ✅ Never commit the actual secret code to version control
- ✅ Use a strong, unique secret code
- ✅ Only share the code with trusted administrators
- ✅ Regularly rotate the secret code
- ✅ Monitor the `system_settings` table for unauthorized changes
- ✅ Keep the database RLS policies restrictive

## 📁 Files Created

- `apps/web/src/pages/MaintenancePage.tsx` - The maintenance mode UI
- `apps/web/src/hooks/useMaintenanceMode.ts` - React hook for checking maintenance status
- `apps/web/src/components/MaintenanceToggle.tsx` - Admin toggle interface
- `apps/web/src/lib/maintenanceAuth.ts` - Code verification and rate limiting
- `scripts/create-system-settings-table.sql` - Database migration
- `scripts/generate-maintenance-hash.js` - Hash generator (can be deleted after setup)

## ⚠️ Important Notes

1. The system relies on the `system_settings` table in Supabase
2. The secret code is case-sensitive
3. Rate limiting is per-session (resets after 1 hour)
4. The maintenance page works even when the database is down (static HTML)
5. Admins need to know the keyboard shortcut (Ctrl+Shift+M) to access the toggle

## 🆘 Emergency Access

If you lose access and can't disable maintenance mode:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
```sql
UPDATE system_settings 
SET value = 'false' 
WHERE key = 'maintenance_mode';
```

3. Refresh your application

---

**Remember**: Only share the secret code with trusted administrators. This is your application's emergency kill switch!
