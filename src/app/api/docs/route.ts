import { NextResponse } from 'next/server';
import { getApiDocs } from '@/config/swagger.config';

export async function GET() {
  const spec = await getApiDocs();
  return NextResponse.json(spec);
}
