# Brainrot Video Automator

A production-ready SaaS application for automating the creation, editing, scheduling, and posting of short-form "Brainrot" videos using entirely free, open-source tools.

## Features

- AI-powered script generation using Google Gemini 2.5 Flash
- Free TTS via Microsoft Edge TTS
- Local speech-to-text via Whisper.cpp
- Multi-account matrix (YouTube + Instagram)
- Automated scheduling (12:30 PM + 7:30 PM IST)
- Smart video rendering with fluent-ffmpeg
- ASS subtitle generation with word-level timestamps

## Tech Stack

- **Frontend**: Next.js 13 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Express.js (runs alongside Next.js)
- **Database**: Supabase (PostgreSQL with RLS)
- **Video Processing**: fluent-ffmpeg, yt-dlp
- **AI**: Google Gemini (free tier: 15 RPM)
- **TTS**: Edge TTS (via Python pip)
- **STT**: Whisper (via Python pip)

## Project Structure

```
brainrot-video-automator/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing/auth page
│   ├── workspace/         # Main dashboard
│   ├── how-to-use/         # Documentation
│   └── api/               # API route handlers
├── server/                 # Express.js backend
│   ├── index.ts           # Main server entry
│   ├── services/          # Core services
│   │   ├── ai.ts          # Gemini + TTS + Whisper
│   │   ├── video.ts       # FFmpeg + yt-dlp
│   │   ├── oauth.ts       # YouTube/Instagram OAuth
│   │   ├── posting.ts     # Platform posting
│   │   ├── pipeline.ts    # Video processing pipeline
│   │   └── scheduler.ts   # Cron job scheduler
│   ├── utils/             # Utilities
│   └── types/             # TypeScript types
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   └── video-player.tsx   # Custom video player
├── hooks/                 # React hooks
│   └── useAuth.tsx        # Authentication hook
├── lib/                   # Shared libraries
│   ├── api.ts             # API client
│   ├── supabase.ts        # Supabase client
│   └── database.types.ts  # TypeScript types
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose
└── .env.example          # Environment template
```

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose
- Supabase project (free tier)
- Google Gemini API key (free: https://makersuite.google.com/app/apikey)
- YouTube/Instagram OAuth credentials (optional for posting)

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GEMINI_API_KEY` - Your Gemini API key

### 3. Docker Deployment

```bash
docker-compose up -d --build
```

Access the application at http://localhost:3000

### 4. Local Development

```bash
# Install dependencies
npm install

# Run development servers
npm run dev
```

## Video Processing Pipeline

1. **Download** - yt-dlp extracts video segment
2. **Script** - Gemini AI generates viral script
3. **TTS** - Edge TTS creates voiceover
4. **Subtitles** - Whisper extracts word timestamps
5. **Render** - FFmpeg composites final video with:
   - Smart crop (16:9 to 9:16)
   - Burned-in ASS subtitles
   - Mixed audio (10% background, 100% TTS)

## API Endpoints

### Authentication
- `GET /api/oauth/youtube` - Get YouTube OAuth URL
- `GET /api/oauth/youtube/callback` - YouTube OAuth callback
- `GET /api/oauth/instagram` - Get Instagram OAuth URL
- `GET /api/oauth/instagram/callback` - Instagram OAuth callback

### Videos
- `POST /api/videos` - Create new video job
- `GET /api/videos` - List user's videos
- `GET /api/videos/:id` - Get video details
- `PATCH /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `POST /api/videos/:id/approve` - Approve and schedule
- `POST /api/videos/:id/reprocess` - Reprocess failed video

### AI
- `POST /api/ai/script` - Generate script via Gemini
- `GET /api/voices` - List available TTS voices

### Scheduler
- `GET /api/scheduler/status` - Get scheduler status

## Database Schema

Tables created via Supabase migrations:

- `profiles` - User profiles
- `social_accounts` - Linked YouTube/Instagram accounts
- `video_queue` - Video processing queue
- `processing_jobs` - Individual processing step tracking
- `api_rate_limits` - Rate limit tracking

## Zero-Cost Stack

All core features use free tools:

| Feature | Tool | Free Limit |
|---------|------|------------|
| AI Script | Gemini 2.5 Flash | 15 RPM |
| TTS | Edge TTS | Unlimited |
| STT | Whisper.cpp | Unlimited (local) |
| Database | Supabase | 500MB |
| Hosting | Docker | Self-hosted |

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT License - See LICENSE file for details.
