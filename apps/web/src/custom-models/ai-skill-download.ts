import skill from "../../../../.agents/skills/create-cabane-model/SKILL.md?raw";
import conventions from "../../../../.agents/skills/create-cabane-model/references/export.md?raw";
import blender from "../../../../.agents/skills/create-cabane-model/examples/blender.py?raw";
import three from "../../../../.agents/skills/create-cabane-model/examples/three.mjs?raw";
import validator from "../../../../.agents/skills/create-cabane-model/scripts/validate_glb.py?raw";
import { downloadCabaneBytes, createModelSkillArchive } from "@cabane/engine";

export async function downloadModelSkill() {
  downloadCabaneBytes(
    createModelSkillArchive({
      "create-cabane-model/SKILL.md": skill,
      "create-cabane-model/references/export.md": conventions,
      "create-cabane-model/examples/blender.py": blender,
      "create-cabane-model/examples/three.mjs": three,
      "create-cabane-model/scripts/validate_glb.py": validator,
    }),
    "create-cabane-model.zip",
    "application/zip",
  );
}
