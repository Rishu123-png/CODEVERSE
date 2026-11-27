"""Actual Blender/MPFB export recipe; no direct-OBJ fallback or fabricated success.

Run with pinned bpy in Python, or Blender --background --factory-startup --python
this_file -- --source ... --output ... --report ... . Requires an empty study scene.
This is a fixed-body diagnostic, not a finished CodeVerse protagonist.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import traceback


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args(argv)
    source = Path(args.source).resolve()
    output = Path(args.output).resolve()
    report_path = Path(args.report).resolve()
    report = {"scope": "actual MPFB/Blender fixed-base export study, NOT finished hero or locomotion", "source_tag": "v2.0.18", "stage": "import_bpy", "success": False, "operations_completed": []}
    try:
        import bpy
        report["blender"] = bpy.app.version_string
        report["operations_completed"].append("import_bpy")
        if bpy.app.version[:2] != (4, 5):
            raise RuntimeError("Recipe is source-reviewed for Blender 4.5; review before another version")
        report["stage"] = "register_mpfb"
        sys.path.insert(0, str(source / "src"))
        bpy.ops.preferences.addon_enable(module="mpfb")
        from mpfb.services.humanservice import HumanService
        from mpfb.services.targetservice import TargetService
        from mpfb.services.exportservice import ExportService
        from mpfb.services.objectservice import ObjectService
        report["operations_completed"].append("register_mpfb")
        report["stage"] = "generate_fixed_base"
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
        macros = TargetService.get_default_macro_info_dict()
        report["macro_settings"] = macros
        body = HumanService.create_human(scale=0.1, feet_on_ground=True, macro_detail_dict=macros)
        rig = HumanService.add_builtin_rig(body, "game_engine")
        if rig is None or rig.type != "ARMATURE":
            raise RuntimeError("MPFB did not return an armature")
        report["operations_completed"].append("generate_fixed_base")
        report["source_body_vertices"] = len(body.data.vertices)
        report["source_bones"] = len(rig.data.bones)
        report["stage"] = "stage_export_copy"
        export_root = ExportService.create_character_copy(body, name_suffix="_A1_export")
        export_body = ObjectService.find_object_of_type_amongst_nearest_relatives(export_root, "Basemesh")
        ExportService.bake_modifiers_remove_helpers(export_body, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=False)
        material = bpy.data.materials.new("A1 neutral fixed-body diagnostic, not skin")
        material.use_nodes = True
        principled = material.node_tree.nodes.get("Principled BSDF")
        principled.inputs["Base Color"].default_value = (0.12, 0.23, 0.34, 1)
        principled.inputs["Roughness"].default_value = 0.8
        export_body.data.materials.clear()
        export_body.data.materials.append(material)
        report["export_body_vertices"] = len(export_body.data.vertices)
        report["export_body_faces"] = len(export_body.data.polygons)
        report["operations_completed"].append("stage_export_copy")
        report["stage"] = "create_original_bend_probe"
        bpy.context.scene.render.fps = 30
        bpy.context.scene.frame_start = 0
        bpy.context.scene.frame_end = 30
        export_root.animation_data_create()
        export_root.animation_data.action = bpy.data.actions.new("A1_original_joint_probe_NOT_locomotion")
        for name, axis, sign in [("lowerarm_l", 0, 1), ("calf_l", 0, -1)]:
            bone = export_root.pose.bones[name]
            bone.rotation_mode = "XYZ"
            for frame, angle in [(0, 0), (15, sign * math.pi / 4), (30, 0)]:
                bone.rotation_euler[axis] = angle
                bone.keyframe_insert(data_path="rotation_euler", frame=frame)
        bpy.context.scene.frame_set(0)
        report["operations_completed"].append("create_original_bend_probe")
        output.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(output / "mpfb-diagnostic-master.blend"))
        bpy.ops.object.select_all(action="DESELECT")
        for obj in [export_root, *export_root.children_recursive]:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = export_root
        report["stage"] = "export_glb_variants"
        report["exports"] = {}
        for name, all_influences in [("all-influences", True), ("four-influences", False)]:
            path = output / (name + ".glb")
            result = bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                export_skins=True, export_all_influences=all_influences, export_influence_nb=4,
                export_animations=True, export_animation_mode="ACTIVE_ACTIONS", export_force_sampling=True,
                export_morph=False, export_yup=True)
            if "FINISHED" not in result:
                raise RuntimeError(f"Exporter failed: {name}: {result}")
            blob = path.read_bytes()
            report["exports"][name] = {"bytes": len(blob), "sha256": hashlib.sha256(blob).hexdigest(), "all_influences": all_influences}
        report["operations_completed"].append("export_glb_variants")
        report["stage"] = "exported_NOT_accepted"
        report["success"] = True
        report["still_required"] = ["glTF validation/reimport", "actual browser binding/deformation comparison", "garment/hair/skin resources and quality", "locomotion retargeting", "owner visual acceptance"]
    except Exception as exc:
        report["error"] = str(exc)
        report["traceback"] = traceback.format_exc()
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
