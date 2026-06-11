#!/bin/bash
# Extract audio from Strixhaven college mp4 files and convert to mp3

set -e

PLAY_DIR="$HOME/play"
AUDIO_DIR="$(dirname "$0")/../audio"

COLLEGES=(silverquill prismari witherbloom lorehold quandrix)

for college in "${COLLEGES[@]}"; do
  src="$PLAY_DIR/${college}.mp4"
  dst="$AUDIO_DIR/${college}.mp3"
  if [ ! -f "$src" ]; then
    echo "ERROR: $src not found"
    exit 1
  fi
  echo "Extracting $college..."
  ffmpeg -i "$src" -vn -acodec libmp3lame -q:a 2 "$dst" -y
  echo "  -> $dst"
done

echo "Done. All 5 Strixhaven college audio files extracted."
