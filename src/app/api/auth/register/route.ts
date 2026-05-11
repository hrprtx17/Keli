import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Workspace from '@/models/Workspace';
import Agent from '@/models/Agent';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
}

function generateApiKey() {
  return 'ad_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'owner'
    });

    const workspace = await Workspace.create({
      name: `${name}'s Workspace`,
      slug: generateSlug(name),
      ownerId: user._id
    });

    const apiKey = generateApiKey();

    await Agent.create({
      workspaceId: workspace._id,
      name: 'Default Assistant',
      description: 'Your first AI assistant',
      apiKey,
      model: 'llama-3.1-8b-instant'
    });

    user.workspaceId = workspace._id;
    await user.save();

    return NextResponse.json({ success: true, message: 'Account created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
