import { spawnSync } from "node:child_process";
import { focusedGroups, verificationHelp } from "../tests/verification-groups.mjs";

const [group, ...extra] = process.argv.slice(2);
if ((!group || group === "--help") && extra.length === 0) {
  console.log(verificationHelp());
} else {
  if (!focusedGroups.includes(group) || extra.length) throw new Error(verificationHelp());
  if (process.env.CABANE_TEST_SUITE)
    throw new Error(
      "Focused verification must include both unit and browser tests; unset CABANE_TEST_SUITE.",
    );
  for (const command of ["verify:fast", "test"]) {
    const result = spawnSync("npm", ["run", command], {
      stdio: "inherit",
      env: { ...process.env, CABANE_VERIFY_GROUP: group },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
