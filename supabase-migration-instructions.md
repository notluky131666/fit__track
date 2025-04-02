# Migrating to Supabase Database

This document provides instructions for migrating Luke's Fit Track from in-memory storage to Supabase database for persistent data storage.

## Step 1: Set Up Supabase Project

1. Create a Supabase account at [https://supabase.io](https://supabase.io) if you don't have one already
2. Create a new Supabase project
3. Navigate to the SQL Editor in your Supabase dashboard

## Step 2: Create Database Tables

1. Open the SQL Editor in your Supabase dashboard
2. Copy the entire contents of the `supabase_tables_setup.sql` file in this project
3. Paste it into the SQL Editor and execute the script
4. Verify that all tables have been created by checking the "Table Editor" section

## Step 3: Configure Supabase Connection

1. Navigate to the Settings > API section in your Supabase dashboard
2. Copy the "URL" and "anon/public" key
3. Create environment variables in your application:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon/public key

## Step 4: Enable Supabase Storage in the Application

1. Open the file `server/storage.ts`
2. Edit the storage export to use SupabaseStorage:
   ```typescript
   // Change from:
   export const storage = new MemStorage();
   
   // To:
   export const storage = new SupabaseStorage();
   ```

## Step 5: Test the Migration

1. Restart the application
2. Navigate through the different features to verify they're working correctly
3. Add some test data to confirm it's being saved to the Supabase database

## Step 6: Migrate Existing Data (Optional)

If you have important data in the in-memory storage that you want to preserve:

1. Export the data through the application's interface
2. Import the data into Supabase using the SQL Editor or programmatically

## Troubleshooting

### Database Connection Issues

If you experience connection issues:

1. Verify that your Supabase URL and API key are correct
2. Check that your IP address is allowed in Supabase network settings
3. Ensure there are no firewall rules blocking outbound connections to Supabase

### Type Conversion Errors

If you see type conversion errors in the console:

1. Check the schema definitions in the Supabase tables
2. Make sure the data types in your application match the database schema
3. Add conversion logic in the SupabaseStorage implementation if needed