import subprocess,json,base64,pathlib,hashlib
root=pathlib.Path('.cache/g2/rocketbox');root.mkdir(parents=True,exist_ok=True)
repo='repos/microsoft/Microsoft-Rocketbox';ref='0943055db6ec570bcef9f2c8b41c9e5467c808f9'
paths=['LICENSE.md','Assets/Avatars/Adults/Male_Adult_04/Export/Male_Adult_04.fbx']
paths += ['Assets/Avatars/Adults/Male_Adult_04/Textures/'+n for n in ['m006_body_color.tga','m006_body_normal.tga','m006_head_color.tga','m006_head_normal.tga','m006_opacity_color.tga']]
paths += ['Assets/Animations/all_animations_max_motextr_static/m_idle_breathe_01.max.fbx','Assets/Animations/all_animations_max_motextr_xy/m_walk_neutral_01.max.fbx','Assets/Animations/all_animations_max_motextr_xy/m_run_neutral_01.max.fbx']
expected={item['file']:item['sha256'] for item in json.loads(pathlib.Path('docs/evidence/g1-graphics/character-source.json').read_text())['files']}
manifest=[]
for p in paths:
 dest=root/pathlib.Path(p).name
 if not dest.exists():
  j=json.loads(subprocess.check_output(['gh','api',repo+'/contents/'+p+'?ref='+ref]))
  if not j.get('content'): j=json.loads(subprocess.check_output(['gh','api',j['git_url']]))
  dest.write_bytes(base64.b64decode(j['content']))
 b=dest.read_bytes()
 if hashlib.sha256(b).hexdigest()!=expected[dest.name]: raise SystemExit('Source integrity mismatch: '+str(dest))
 manifest.append({'path':p,'file':dest.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()});print(dest.name,len(b),flush=True)
(root/'source-manifest.json').write_text(json.dumps({'repo':'https://github.com/microsoft/Microsoft-Rocketbox','commit':ref,'license':'MIT','files':manifest},indent=2)+'\n')

# Restore the isolated converter manifest, not runtime dependencies.
import shutil
sdk=pathlib.Path('.cache/g2/tools');sdk.mkdir(parents=True,exist_ok=True)
for suffix in ['package.json','package-lock.json']:
 shutil.copyfile(pathlib.Path('scripts/g1')/('urban-toolchain-'+suffix),sdk/suffix)
hdr=pathlib.Path('.cache/g2/pedestrian_overpass_1k.hdr')
if not hdr.exists():
 blob=json.loads(subprocess.check_output(['gh','api','repos/mrdoob/three.js/git/blobs/4d119b90c784cafd83c0cf0bdb226f8a285d1380']))
 hdr.write_bytes(base64.b64decode(blob['content']))
print('Optional urban FBX/HDR inputs restored. Run npm ci --prefix .cache/g2/tools.')

if hashlib.sha256(hdr.read_bytes()).hexdigest()!='3d2c4068676cfead5dce9a12896cf1ebcac4e97914938e3c2987b70cad4e4c4a': raise SystemExit('HDR integrity mismatch')
sdk=pathlib.Path('.cache/a1/tools');sdk.mkdir(parents=True,exist_ok=True)
for suffix in ['package.json','package-lock.json']:
 shutil.copyfile(pathlib.Path('scripts/a1')/('toolchain-'+suffix),sdk/suffix)
