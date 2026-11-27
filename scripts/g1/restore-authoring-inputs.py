"""Optional repository-only authoring setup. Not required to run the game.
Run from repository root with Python 3. No Blender or system installs.
Restores audited CC0 core data and pinned SDK manifests into ignored cache.
Then run npm ci --prefix .cache/a1/tools explicitly.
"""
from pathlib import Path
import hashlib
import shutil
import urllib.request
import zipfile

root = Path('.cache/a1')
source = root / 'sources'
source.mkdir(parents=True, exist_ok=True)
archive = source / 'mpfb2-v2.0.18.zip'
expected = 'ada7c4ff11e79cf6ed9b441bccabc52c9359f2848b988f66e89c14c30b21fed7'
if not archive.exists():
    urllib.request.urlretrieve(
        'https://codeload.github.com/makehumancommunity/mpfb2/zip/refs/tags/v2.0.18',
        archive)
if hashlib.sha256(archive.read_bytes()).hexdigest() != expected:
    raise SystemExit('MPFB archive hash mismatch: do not extract or use it.')
with zipfile.ZipFile(archive) as z:
    dest = source.resolve()
    for member in z.infolist():
        if not (dest / member.filename).resolve().is_relative_to(dest):
            raise SystemExit('Unsafe archive path')
    z.extractall(source)
tools = root / 'tools'
tools.mkdir(parents=True, exist_ok=True)
for name in ['package.json', 'package-lock.json']:
    shutil.copyfile(Path('scripts/a1') / ('toolchain-' + name), tools / name)
Path('.cache/g1').mkdir(parents=True, exist_ok=True)
print('Verified authoring input and pinned SDK manifests restored. No MPFB code executed.')
