import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${FRONTEND_URL}/workspace?error=youtube_auth_failed`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${FRONTEND_URL}/workspace?error=missing_parameters`);
  }

  try {
    const response = await fetch(
      `${API_URL}/api/oauth/youtube/callback?code=${code}&state=${state}`,
      { method: 'GET' },
    );

    if (!response.ok) {
      throw new Error('OAuth callback failed');
    }

    return NextResponse.redirect(`${FRONTEND_URL}/workspace?linked=youtube`);
  } catch (err) {
    return NextResponse.redirect(`${FRONTEND_URL}/workspace?error=youtube_link_failed`);
  }
}
