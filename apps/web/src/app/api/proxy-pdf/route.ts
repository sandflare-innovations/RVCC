import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse(`Failed to fetch PDF: ${res.statusText}`, { status: res.status });
    }
    
    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Internal server error while proxying PDF', { status: 500 });
  }
}
