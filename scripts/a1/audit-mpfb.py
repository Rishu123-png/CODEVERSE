"""Non-executing audit of official MPFB source. Does not import Blender/MPFB."""
import collections
import hashlib
import json
from pathlib import Path
import sys

root = Path(sys.argv[1])
out = Path(sys.argv[2])
data = root / "src/mpfb/data"
vertices, groups, group, faces = [], collections.Counter(), "", []
for line in (data / "3dobjs/base.obj").read_text().splitlines():
    fields = line.split()
    if not fields:
        continue
    if fields[0] == "v":
        vertices.append(list(map(float, fields[1:4])))
    elif fields[0] == "g":
        group = " ".join(fields[1:])
    elif fields[0] == "f":
        ids = [int(x.split("/")[0]) - 1 for x in fields[1:]]
        faces.append((group, ids))
        groups[group] += 1
rig = json.loads((data / "rigs/standard/rig.game_engine.json").read_text())
weights = json.loads((data / "rigs/standard/weights.game_engine.json").read_text())
influences = collections.defaultdict(list)
for bone, entries in weights["weights"].items():
    assert bone in rig, bone
    for index, weight in entries:
        assert 0 <= index < len(vertices), index
        assert 0 <= weight <= 1, weight
        if weight > 0:
            influences[index].append(weight)
body_ids = set(i for group, ids in faces if group == "body" for i in ids)
assert all(not bone["parent"] or bone["parent"] in rig for bone in rig.values())
body_bounds = [[min(vertices[i][a] for i in body_ids), max(vertices[i][a] for i in body_ids)] for a in range(3)]
source_files = ["LICENSE.md", "LICENSE.CODE.md", "LICENSE.ASSETS.md", "src/mpfb/blender_manifest.toml", "src/mpfb/data/3dobjs/base.obj", "src/mpfb/data/rigs/standard/rig.game_engine.json", "src/mpfb/data/rigs/standard/weights.game_engine.json", "script_samples/10_complete_character_export_fbx.py"]
report = {
    "scope": "MPFB v2.0.18 source audit only; no generator, rig or deformation executed",
    "source": "https://github.com/makehumancommunity/mpfb2/tree/v2.0.18",
    "hashes": {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in source_files},
    "manifest": (root / "src/mpfb/blender_manifest.toml").read_text(),
    "base_obj": {"vertices_including_helpers": len(vertices), "faces_including_helpers": len(faces), "body_faces": groups["body"], "body_fan_triangulation_count": sum(len(ids)-2 for g, ids in faces if g == "body"), "body_referenced_vertices": len(body_ids), "body_bounds_source_coordinates": body_bounds, "groups": dict(groups)},
    "game_engine_rig": {"bones": len(rig), "names": list(rig), "weight_file_license": weights["license"], "weights_version": weights["version"], "max_positive_influences_body_vertex": max(len(influences[i]) for i in body_ids), "body_vertices_over_4_influences": sum(len(influences[i]) > 4 for i in body_ids), "body_vertices_without_positive_weights": sum(not influences[i] for i in body_ids), "max_body_weight_sum_deviation": max(abs(sum(influences[i])-1) for i in body_ids)},
    "checks": {"bone_parents_resolve": True, "weight_indices_in_obj_range": True, "weight_values_in_0_1": True},
    "not_verified": ["actual Blender generator execution", "installed core skin/eyes/proxies", "runtime skeleton orientation and bind pose", "fitting/deformation", "glTF export from MPFB", "animation retargeting", "finished hero quality"],
}
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({k: v for k, v in report.items() if k not in ["hashes", "manifest", "base_obj"]}, indent=2))
print(json.dumps({k: v for k, v in report["base_obj"].items() if k != "groups"}, indent=2))
