import { createServer } from "vite";

const argument = (flag) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const stage = argument("--stage");
const fixture = argument("--fixture");
const requestedRoomId = argument("--room-id");
if (!["layout", "room", "scale"].includes(stage)) {
  throw new Error("Home verification requires --stage layout, room, or scale.");
}

async function run() {
  const server = await createServer({
    root: process.cwd(),
    appType: "custom",
    configFile: false,
    server: { middlewareMode: true, hmr: false },
    cacheDir: "/tmp/cabane-home-verification-vite-cache",
  });

  try {
    const [
      { validateHomeManifest },
      { validateRuntimeBindingProfile },
      { stableDeviceRegistry },
      source,
    ] = await Promise.all([
      server.ssrLoadModule("/packages/engine/src/validation.ts"),
      server.ssrLoadModule("/packages/engine/src/runtime-binding-profile.ts"),
      server.ssrLoadModule("/packages/catalog/src/device/index.ts"),
      server.ssrLoadModule(fixture ? "/tests/fixtures/agent-home.tsx" : "/home/src/index.ts"),
    ]);
    const manifest =
      fixture === "layout"
        ? source.layoutFixtureManifest
        : fixture === "room"
          ? source.equippedFixtureManifest
          : fixture === "scale"
            ? source.scaleFixtureManifest
            : source.homeManifest;
    if (!manifest) {
      throw new Error(
        "The owner home is not configured yet; generate a layout before running this stage gate.",
      );
    }
    const validation = validateHomeManifest(manifest, {
      deviceModels: stableDeviceRegistry,
    });
    if (!validation.canRender || validation.issues.length > 0) {
      throw new Error(
        validation.issues
          .map((issue) => `${issue.path} [${issue.code}]: ${issue.message}`)
          .join("\n"),
      );
    }
    if (
      /\b(?:light|switch|input_boolean|climate|cover|fan|media_player|humidifier|water_heater|vacuum|lock|alarm_control_panel|valve|siren|select|number|button|camera|sensor|binary_sensor)\.[a-z0-9_]+\b/i.test(
        JSON.stringify(manifest),
      )
    ) {
      throw new Error("Generated manifests must not contain household Home Assistant entity IDs.");
    }

    const rooms = manifest.floors.flatMap((floor) => floor.rooms);
    if (stage === "layout") {
      const equipped = rooms.filter((room) => room.furnishings || room.devices.length > 0);
      if (equipped.length > 0) {
        throw new Error(
          `Layout-stage home must remain unfurnished; found ${equipped.map((room) => room.id).join(", ")}.`,
        );
      }
      const wallCount = manifest.floors.reduce((count, floor) => count + floor.walls.length, 0);
      const openingCount = manifest.floors.reduce(
        (count, floor) => count + floor.openings.length,
        0,
      );
      console.log(
        `Verified complete unfurnished fixture: ${rooms.length} rooms, ${wallCount} walls, ${openingCount} openings.`,
      );
      console.log("LAYOUT_REVIEW_REQUIRED");
      return;
    }

    if (stage === "room") {
      const roomId = requestedRoomId ?? (fixture === "room" ? "fixture-studio" : undefined);
      if (!roomId) throw new Error("Room-stage verification requires --room-id <id>.");
      const room = rooms.find((candidate) => candidate.id === roomId);
      if (!room) throw new Error(`Room "${roomId}" does not exist.`);
      if (!room.furnishings && room.devices.length === 0) {
        throw new Error(`Room "${roomId}" has no furnishings or devices to review.`);
      }
      if (fixture === "room") {
        const otherEquipped = rooms.filter(
          (candidate) =>
            candidate.id !== roomId && (candidate.furnishings || candidate.devices.length > 0),
        );
        if (otherEquipped.length > 0) {
          throw new Error("The staged room fixture must equip exactly one room.");
        }
        const profileValidation = validateRuntimeBindingProfile(
          source.equippedFixtureProfile,
          manifest,
          source.connectedCatalogRuntime,
        );
        if (!profileValidation.valid) {
          throw new Error(
            profileValidation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"),
          );
        }
      }
      console.log(
        `Verified equipped room "${roomId}" with ${room.devices.length} exact device placements.`,
      );
      console.log(`ROOM_REVIEW_REQUIRED:${roomId}`);
      return;
    }

    const bindingCount = Object.keys(source.scaleFixtureProfile?.entityIdsBySlotId ?? {}).length;
    if (rooms.length !== 20 || bindingCount !== 100) {
      throw new Error(
        `Scale fixture must contain 20 rooms and 100 runtime profile bindings; found ${rooms.length} and ${bindingCount}.`,
      );
    }
    const profileValidation = validateRuntimeBindingProfile(source.scaleFixtureProfile, manifest);
    if (!profileValidation.valid) {
      throw new Error(
        profileValidation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"),
      );
    }
    console.log("Verified representative scale: 20 rooms and 100 exact runtime profile bindings.");
    console.log("SCALE_FIXTURE_READY");
  } finally {
    await server.close();
  }
}

await run();
