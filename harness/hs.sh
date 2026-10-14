#!/usr/bin/env sh
# Dùng trong máy ảo Linux của Claude: ./hs <lệnh> <tập>. Dùng ffmpeg của hệ thống thay cho bản .exe cài từ Windows.
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/cli/hs.mjs" "$@"
