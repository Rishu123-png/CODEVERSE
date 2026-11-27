"""Encode actual captured frames, deliberately retimed (NOT native FPS footage).
Optional authoring deps: Pillow and imageio-ffmpeg, or set FFMPEG_BINARY.
Usage: python scripts/g2/encode-evidence.py FOLDER OUTPUT.mp4 [camera|route]
"""
import os
import sys
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

folder, output = Path(sys.argv[1]), Path(sys.argv[2])
mode = sys.argv[3] if len(sys.argv) > 3 else "camera"
encoder = os.environ.get("FFMPEG_BINARY")
if not encoder:
    import imageio_ffmpeg
    encoder = imageio_ffmpeg.get_ffmpeg_exe()
frames = sorted(folder.glob("[0-9]*.jpg"))
if not frames:
    raise RuntimeError("No actual captured frames")
output.parent.mkdir(parents=True, exist_ok=True)
width, height = Image.open(frames[0]).size
proc = subprocess.Popen([
    encoder, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
    "-s", f"{width}x{height}", "-r", "2", "-i", "-", "-an", "-c:v", "libx264",
    "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)
], stdin=subprocess.PIPE)
phases = ["Standing / slow orbit"] * 6 + ["Standing / fast orbit"] * 6 + ["Walking / orbit"] * 6 + ["Running / orbit"] * 6 + ["Wheel zoom"] * 4
for index, frame in enumerate(frames):
    image = Image.open(frame).convert("RGB")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, height - 38, width, height), fill=(12, 19, 27))
    phase = phases[index] if mode == "camera" and index < len(phases) else "Connected route / collision-controller sequence"
    draw.text((8, height - 34), f"{phase} | captured frame {index + 1}/{len(frames)}", fill="white")
    draw.text((8, height - 18), "RETIMED 2 frames/s. Software render. Not real-time/FPS evidence.", fill=(255, 211, 135))
    proc.stdin.write(image.tobytes())
proc.stdin.close()
if proc.wait() != 0:
    raise RuntimeError("Encoder failed")
print(output, len(frames), "actual captures, explicitly retimed")
