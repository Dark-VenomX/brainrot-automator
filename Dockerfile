# Brainrot Video Automator - Complete Docker Environment
# Installs Node.js, Python, FFmpeg, yt-dlp, and build tools for whisper-node

FROM node:20-bullseye

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies including build tools for whisper.cpp compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build essentials for compiling whisper.cpp
    build-essential \
    make \
    g++ \
    cmake \
    # Python for edge-tts and whisper
    python3 \
    python3-pip \
    python3-dev \
    # FFmpeg for video processing
    ffmpeg \
    # Additional video/audio codecs
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    # Graphics and fonts for subtitle rendering
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    # SSL and networking
    ca-certificates \
    curl \
    wget \
    # Git for potential builds
    git \
    # Process management
    supervisor \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp globally
RUN pip3 install --no-cache-dir yt-dlp

# Install edge-tts for free TTS
RUN pip3 install --no-cache-dir edge-tts

# Install whisper.cpp Python bindings (optional, for fallback)
RUN pip3 install --no-cache-dir openai-whisper 2>/dev/null || true

# Set up working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production=false

# Build whisper-node native binaries
# This compiles whisper.cpp during build time
RUN cd node_modules/whisper-node && \
    if [ -f "scripts/build.js" ]; then node scripts/build.js; fi || \
    if [ -f "scripts/download.js" ]; then node scripts/download.js; fi || true

# Copy application code
COPY . .

# Accept build arguments for Next.js public variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build Next.js application
RUN npm run build

# Create necessary directories for processing
RUN mkdir -p /app/temp /app/outputs /app/logs

# Create startup script for supervisord
RUN echo '[supervisord]' > /etc/supervisor/conf.d/brainrot.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo '' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo '[program:nextjs]' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'command=npm run start:next' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'directory=/app' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'stderr_logfile=/var/log/nextjs.err.log' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'stdout_logfile=/var/log/nextjs.out.log' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo '' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo '[program:express]' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'command=npm run start:server' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'directory=/app' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'stderr_logfile=/var/log/express.err.log' >> /etc/supervisor/conf.d/brainrot.conf && \
    echo 'stdout_logfile=/var/log/express.out.log' >> /etc/supervisor/conf.d/brainrot.conf

# Expose ports
# 3000 - Next.js frontend
# 3001 - Express backend API
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start services via supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
