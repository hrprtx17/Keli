import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DataSource from '@/models/DataSource';
import { auth } from '@/auth';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  if (!agentId) return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });

  await connectDB();
  const sources = await DataSource.find({ 
    agentId, 
    workspaceId: (session.user as any).workspaceId 
  });
  
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const formData = await req.formData();
  const agentId = formData.get('agentId') as string;
  const type = formData.get('type') as 'pdf' | 'url' | 'text';
  
  if (!agentId || !type) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  let name = formData.get('name') as string;
  let content = '';
  let metadata: any = {};

  try {
    if (type === 'text') {
      content = formData.get('text') as string;
      if (!content) throw new Error('Text content required');
      metadata.wordCount = content.split(/\s+/).length;
    } else if (type === 'url') {
      const url = formData.get('url') as string;
      if (!url) throw new Error('URL required');
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);
      $('script, style, nav, footer, iframe, img').remove();
      content = $('body').text().replace(/\s+/g, ' ').trim();
      name = name || $('title').text() || url;
      metadata.url = url;
    } else if (type === 'pdf') {
      const file = formData.get('file') as File;
      if (!file) throw new Error('PDF file required');
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buffer);
      content = data.text;
      name = name || file.name;
      metadata.size = file.size;
      metadata.pages = data.numpages;
    }

    const dataSource = await DataSource.create({
      agentId,
      workspaceId: (session.user as any).workspaceId,
      type,
      name: name || `Unnamed ${type}`,
      content,
      status: 'ready',
      metadata
    });

    return NextResponse.json(dataSource, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
