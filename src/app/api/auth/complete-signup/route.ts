import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userProfiles } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, displayName, role } = body;

    if (!userId || !email || !displayName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user record
    await db.insert(users).values({
      id: userId,
      email,
      roles: role === 'host' 
        ? { host: true, seeker: false } 
        : { host: false, seeker: true },
      status: 'ACTIVE',
    });

    // Create user profile
    await db.insert(userProfiles).values({
      userId,
      displayName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signup completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
