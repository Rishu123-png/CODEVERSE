"""Extract CC0 core graphics/weights for the original G1 runtime authoring route.
NOT Blender/MPFB execution, macro target generation or third-party retargeting.
"""
import json
from pathlib import Path
from collections import defaultdict

source = Path('.cache/a1/sources/mpfb2-2.0.18/src/mpfb/data')
vertices, groups, faces, group = [], defaultdict(set), [], ''
for line in (source / '3dobjs/base.obj').read_text().splitlines():
    f = line.split()
    if not f:
        continue
    if f[0] == 'v':
        vertices.append([float(x)*.1 for x in f[1:4]])
    elif f[0] == 'g':
        group = f[1]
    elif f[0] == 'f':
        ids = [int(x.split('/')[0])-1 for x in f[1:]]
        groups[group].update(ids)
        if group == 'body':
            faces.append(ids)
body = sorted(groups['body'])
lookup = {old: new for new, old in enumerate(body)}
low = min(vertices[i][1] for i in body)
scale = 1.8/(max(vertices[i][1] for i in body)-low)
def point(v):
    return [v[0]*scale, (v[1]-low)*scale, v[2]*scale]
rig = json.loads((source / 'rigs/standard/rig.game_engine.json').read_text())
bones = []
for name, bone in rig.items():
    h = bone['head']
    if h['strategy'] == 'CUBE':
        vv = [vertices[i] for i in groups[h['cube_name']]]
        p = [sum(v[a] for v in vv)/len(vv) for a in range(3)]
    elif h['strategy'] == 'VERTEX':
        p = vertices[h['vertex_index']]
    elif h['strategy'] == 'MEAN':
        vv = [vertices[i] for i in h['vertex_indices']]
        p = [sum(v[a] for v in vv)/len(vv) for a in range(3)]
    else:
        raise ValueError(h)
    bones.append({'name': name, 'parent': bone['parent'], 'head': point(p)})
weights = defaultdict(list)
for bone, rows in json.loads((source/'rigs/standard/weights.game_engine.json').read_text())['weights'].items():
    for i, w in rows:
        if w > 0 and i in lookup:
            weights[lookup[i]].append([list(rig).index(bone), w])
output = {'scope': 'CC0 base graphics, original CodeVerse fitted-shell garment and motion authoring input; not MPFB/Blender exported', 'positions': [point(vertices[i]) for i in body], 'faces': [[lookup[i] for i in f] for f in faces], 'bones': bones, 'weights': [weights[i] for i in range(len(body))]}
Path('.cache/g1').mkdir(parents=True, exist_ok=True)
Path('.cache/g1/character-source.json').write_text(json.dumps(output,separators=(',',':')))
print('Extracted',len(body),'body vertices;',len(bones),'bones; all source influences retained.')
