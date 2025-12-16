# Setup Checklist - Fix "Failed to create account" Error

## The Issue
You're getting "Failed to create account" because the database tables haven't been created in Supabase yet.

## Solution: Run the Database Schema

### Step 1: Open Supabase SQL Editor
1. Go to [supabase.com](https://supabase.com) and log in
2. Select your project: **paint-pro-os**
3. Click **SQL Editor** in the left sidebar
4. Click **New query** button

### Step 2: Copy and Run the Schema
1. Open the file `supabase_schema.sql` in this project (588 lines)
2. **Copy the ENTIRE contents** of that file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Tables Were Created
1. Go to **Table Editor** in the left sidebar
2. You should see 25+ tables including:
   - User
   - Session
   - Lead
   - Estimate
   - Job
   - TeamMember
   - And 19+ more...

### Step 4: Seed the Database (Optional but Recommended)
Run this command to populate your database with sample data:

```bash
npm run db:seed
```

This will create:
- Business settings
- 3 team members
- 3 subcontractors
- 24 room prices
- 8 exterior prices
- 10 add-ons
- 3 sample leads
- VTO, Rocks, Scorecard data

### Step 5: Try Creating Account Again
1. Go to [http://localhost:3000](http://localhost:3000)
2. Click **"Sign up"**
3. Enter your details and create account
4. You should now be able to log in successfully!

---

## Common Issues

### Issue: "Failed to create account" still appears
**Cause:** Tables not created properly
**Solution:**
1. Check Supabase Table Editor - do you see the User table?
2. If not, re-run the SQL schema
3. Check for SQL errors in the Supabase SQL Editor output

### Issue: SQL errors when running schema
**Cause:** Partial execution or syntax errors
**Solution:**
1. Delete all tables from Table Editor (if any exist)
2. Copy the ENTIRE `supabase_schema.sql` file again
3. Make sure you copied from the first line to the last line
4. Run it again

### Issue: "Supabase environment variables are not configured"
**Cause:** Missing .env file
**Solution:**
1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials from the dashboard
3. Restart the dev server: `npm run dev`

---

## Quick Verification Commands

### Check if tables exist:
```sql
-- Run this in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see 25+ tables listed.

### Check if User table is ready:
```sql
-- Run this in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'User';
```

You should see columns: id, email, passwordHash, name, role, isActive, lastLoginAt, createdAt, updatedAt

---

## Still Having Issues?

1. **Check the server logs** - Look for specific error messages in your terminal
2. **Verify Supabase credentials** - Make sure the keys in `.env` are correct
3. **Check Supabase project status** - Make sure your project is active (not paused)
4. **Review the README.md** - Step-by-step setup instructions

---

**After completing these steps, your registration should work!** ✅
