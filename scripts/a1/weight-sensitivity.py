"""Source-weight sensitivity only. NOT Blender/MPFB rig/deformation equivalence.
Uses original neutral OBJ, normalized source weights and arbitrary world-axis
hierarchical rigid probes. Does not apply MPFB macro targets, bone rolls or IK.
"""
import argparse
from collections import defaultdict
import hashlib
import json
import math
from pathlib import Path
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument("--source", required=True)
parser.add_argument("--report", required=True)
args = parser.parse_args()
data = Path(args.source) / "src/mpfb/data"
vertices, groups, group, body = [], defaultdict(set), "", set()
for line in (data / "3dobjs/base.obj").read_text().splitlines():
    fields = line.split()
    if not fields:
        continue
    if fields[0] == "v":
        vertices.append([float(x) * 0.1 for x in fields[1:4]])
    elif fields[0] == "g":
        group = fields[1]
    elif fields[0] == "f":
        ids = {int(x.split("/")[0]) - 1 for x in fields[1:]}
        groups[group].update(ids)
        if group == "body":
            body.update(ids)
v = np.asarray(vertices)
rig = json.loads((data / "rigs/standard/rig.game_engine.json").read_text())
wfile = data / "rigs/standard/weights.game_engine.json"
wraw = json.loads(wfile.read_text())["weights"]
weights = defaultdict(list)
for bone, rows in wraw.items():
    for i, w in rows:
        if w > 0:
            weights[i].append((bone, w))
all_weights, four_weights, discarded = {}, {}, []
for i in sorted(body):
    rows = sorted(weights[i], key=lambda x: (-x[1], x[0]))
    total = sum(w for _, w in rows)
    all_weights[i] = [(b, w / total) for b, w in rows]
    keep = rows[:4]
    four_weights[i] = [(b, w / sum(t for _, t in keep)) for b, w in keep]
    discarded.append(sum(w for _, w in rows[4:]) / total)


def head(bone):
    h = rig[bone]["head"]
    if h["strategy"] == "CUBE":
        return v[sorted(groups[h["cube_name"]])].mean(axis=0)
    if h["strategy"] == "MEAN":
        return v[h["vertex_indices"]].mean(axis=0)
    if h["strategy"] == "VERTEX":
        return v[h["vertex_index"]]
    raise ValueError("Unsupported head strategy: " + h["strategy"])


def matrices(angles):
    result = {}
    visiting = set()
    def calc(b):
        if b in result:
            return result[b]
        assert b not in visiting, "Cycle"
        visiting.add(b)
        p = rig[b]["parent"]
        parent = calc(p) if p else np.eye(4)
        a = math.radians(angles.get(b, 0))
        c, s = math.cos(a), math.sin(a)
        rot = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
        local = np.eye(4)
        local[:3, :3] = rot
        pivot = head(b)
        local[:3, 3] = pivot - rot @ pivot
        result[b] = parent @ local
        visiting.remove(b)
        return result[b]
    for bone in rig:
        calc(bone)
    return result


def deform(ws, transforms):
    return np.array([sum((weight * (transforms[bone] @ np.r_[v[i], 1])[:3] for bone, weight in ws[i]), start=np.zeros(3)) for i in sorted(body)])

probes = {"identity": {}, "world_axis_arm_stress": {"upperarm_l": 45, "lowerarm_l": -70, "hand_l": 25}, "world_axis_knee_stress": {"thigh_l": -35, "calf_l": 80, "foot_l": -20}, "world_axis_torso_stress": {"spine_01": 15, "spine_02": -20, "neck_01": 30}}
results = {}
for name, angles in probes.items():
    transforms = matrices(angles)
    full = deform(all_weights, transforms)
    four = deform(four_weights, transforms)
    distances = np.linalg.norm(full-four, axis=1)
    results[name] = {"arbitrary_world_z_degrees": angles, "max_difference_mm": float(distances.max()*1000), "mean_difference_mm": float(distances.mean()*1000), "p95_difference_mm": float(np.percentile(distances, 95)*1000), "vertices_difference_over_0_1_mm": int((distances > .0001).sum())}
assert results["identity"]["max_difference_mm"] < 1e-9
assert all(abs(sum(w for _, w in x)-1) < 1e-12 for x in all_weights.values())
assert all(abs(sum(w for _, w in x)-1) < 1e-12 and len(x) <= 4 for x in four_weights.values())
report = {"scope": "mathematical source-weight sensitivity, NOT an MPFB/Blender export or actual rig anatomical pose test", "source_tag": "v2.0.18", "weights_sha256": hashlib.sha256(wfile.read_bytes()).hexdigest(), "numpy": np.__version__, "body_vertices": len(body), "source_scale_assumption": "raw OBJ multiplied by 0.1; distance units interpreted as meters from MPFB default scale; no macro/feet transform applied", "max_discarded_normalized_weight_mass": max(discarded), "vertices_losing_weight_mass": sum(x > 0 for x in discarded), "probes": results, "checks": {"identity_preserved": True, "both_weight_sets_normalized": True, "four_influence_limit": True, "bone_parent_graph_acyclic": True}, "not_verified": ["Blender bone-roll orientation", "macro-targeted body", "runtime bind pose", "actual glTF exporter influence handling", "anatomical deformation quality", "garment fit", "acceptable four-versus-six policy"]}
Path(args.report).parent.mkdir(parents=True, exist_ok=True)
Path(args.report).write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
