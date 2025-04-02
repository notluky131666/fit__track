# Supabase Migration Guide for Luke's Fit Track

This guide will help you migrate your fitness tracking application from in-memory storage to Supabase for persistent data storage.

## Step 1: Run the SQL Setup Script

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `vcyxfffrhuaznqzbsqnj`
3. Navigate to the SQL Editor tab
4. Create a new query
5. Copy the entire contents of the `supabase-setup.sql` file from this project
6. Paste it into the SQL editor
7. Click "Run" to execute the script

This script will:
- Create all required database tables
- Set up the necessary relationships between tables
- Create a default user "luke" with password "password123"
- Set up default goals for the user
- Configure Row Level Security policies for security

## Step 2: Verify Table Creation

After running the script, you can verify that the tables were created successfully:

1. Go to the "Table Editor" in your Supabase dashboard
2. You should see the following tables:
   - users
   - weight_entries
   - nutrition_entries
   - workout_entries
   - exercise_entries
   - user_goals
   - activity_log

## Step 3: Switch to Supabase Storage

The application has already been configured to use Supabase for storage. In `server/storage.ts`, we've updated the storage implementation to use `SupabaseStorage` instead of `MemStorage`.

If you ever need to switch back to in-memory storage for testing, you can modify the export line in `server/storage.ts`:

```typescript
// For memory storage (no persistence):
export const storage = new MemStorage();
// For Supabase storage (with persistence):
// export const storage = new SupabaseStorage();
```

## Step 4: Testing Your Application

Now that Supabase is properly set up, you should be able to:

1. Add weight entries, nutrition information, and workout logs
2. See data persist even after restarting the server
3. View your historical data in the History page

## Troubleshooting

If you encounter any database-related errors:

1. **Check Console Logs**: Look for specific error messages that might indicate what's wrong
2. **Verify Supabase Connectivity**: Ensure your Supabase URL and API key are correct in `server/supabase.ts`
3. **Check Table Structure**: Ensure all tables were created correctly with the right columns
4. **RLS Policies**: Ensure Row Level Security (RLS) policies are properly set up to allow read/write operations

If you need to restart with fresh data, you can:
1. Go to the "Table Editor" in Supabase
2. Select each table
3. Use the "Delete All Rows" option
4. Run the SQL setup script again to recreate the default user and goals