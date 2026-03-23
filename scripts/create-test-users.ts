// This script uses the Supabase Admin API to create initial test users
// and link them to the test tenants created by seed.sql.

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Requires service role to bypass RLS and create users directly

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const users = [
    {
      email: 'superadmin@virtualgym.com',
      password: 'password123',
      role: 'super_admin',
      fullName: 'Super Admin',
      tenantId: null // platform-wide
    },
    {
      email: 'admin@ironhouse.gym',
      password: 'password123',
      role: 'gym_admin',
      fullName: 'Iron House Admin',
      tenantId: '00000000-0000-0000-0001-000000000001'
    },
    {
      email: 'member@ironhouse.gym',
      password: 'password123',
      role: 'member',
      fullName: 'Jane Member',
      tenantId: '00000000-0000-0000-0001-000000000001'
    }
  ];

  for (const user of users) {
    console.log(`Creating user: ${user.email}...`);
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
      }
    });

    if (authError) {
      if (authError.message.includes("already exist") || authError.message.includes("already been registered")) {
        console.log(`User ${user.email} already exists.`);
        // Try getting the user to update their profile
        const { data: usersData } = await adminAuthClient.auth.admin.listUsers();
        const existingUser = usersData.users.find(u => u.email === user.email);
        if (existingUser) {
          await upsertProfile(existingUser.id, user);
        }
      } else {
        console.error(`Failed to create ${user.email}:`, authError.message);
      }
    } else if (authData.user) {
      await upsertProfile(authData.user.id, user);
      console.log(`Successfully created ${user.email}`);
    }
  }

  console.log("Done seeding test users!");
}

async function upsertProfile(userId: string, user: any) {
  const { error } = await adminAuthClient.from('profiles').upsert({
    id: userId,
    full_name: user.fullName,
    role: user.role,
    tenant_id: user.tenantId,
  });

  if (error) {
    console.error(`Failed to upsert profile for ${user.email}:`, error.message);
  }
}

main().catch(console.error);
