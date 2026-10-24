"""Local-only, deterministic showcase devices; never connects to hardware."""
import json
from pathlib import Path
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.helpers import discovery, area_registry, entity_registry, device_registry

async def async_setup(hass, config):
    path = Path(__file__).with_name("devices.json")
    hass.data["solstice"] = await hass.async_add_executor_job(lambda: json.loads(path.read_text()))
    for domain in {item["domain"] for item in hass.data["solstice"]} | {"media_player", "lock", "camera"}:
        await discovery.async_load_platform(hass, domain, "solstice", {}, config)

    async def assign_showcase_areas(event):
        plan_path = Path(__file__).with_name("runtime-plan.json")
        if not await hass.async_add_executor_job(plan_path.exists):
            return
        plan = await hass.async_add_executor_job(lambda: json.loads(plan_path.read_text()))
        areas, entities = area_registry.async_get(hass), entity_registry.async_get(hass)
        devices = device_registry.async_get(hass)
        room_areas = {}
        for room in plan["rooms"]:
            area = areas.async_get_area_by_name(room["name"])
            if area is None:
                area = areas.async_create(room["name"])
            room_areas[room["id"]] = area.id
            if room.get("temperature_unique_id"):
                matches = [e.entity_id for e in entities.entities.values() if e.platform == "solstice" and e.unique_id == room["temperature_unique_id"]]
                if len(matches) == 1:
                    entities.async_update_entity(matches[0], area_id=area.id)
                    areas.async_update(area.id, temperature_entity_id=matches[0])
        report = {"roomAreaIds": room_areas, "entities": [], "missing": []}
        for assignment in plan["assignments"]:
            entity_id = assignment["entity_id"]
            if assignment.get("unique_id"):
                matches = [e.entity_id for e in entities.entities.values() if e.platform == "solstice" and e.unique_id == assignment["unique_id"]]
                if len(matches) == 1:
                    entity_id = matches[0]
            entry = entities.async_get(entity_id)
            if entry is None:
                report["missing"].append(entity_id)
                continue
            if assignment["roomId"] in room_areas:
                if entry.device_id:
                    devices.async_update_device(entry.device_id, area_id=room_areas[assignment["roomId"]])
                else:
                    entities.async_update_entity(entity_id, area_id=room_areas[assignment["roomId"]])
            if assignment.get("cleaningSegments"):
                area_mapping = {room_areas[r]: segments for r, segments in assignment["cleaningSegments"].items()}
                entities.async_update_entity_options(entity_id, "vacuum", {"area_mapping": area_mapping})
            entry = entities.async_get(entity_id)
            state = hass.states.get(entity_id)
            report["entities"].append({**assignment, "entity_id": entity_id, "area_id": entry.area_id or (devices.async_get(entry.device_id).area_id if entry.device_id else None),
                "device_id": entry.device_id, "platform": entry.platform,
                "disabled_by": entry.disabled_by, "hidden_by": entry.hidden_by,
                "state": state.state if state else None,
                "attributes": {k: v for k, v in state.attributes.items() if k in {"device_class", "unit_of_measurement", "supported_features", "friendly_name"}} if state else {}})
        target = Path(hass.config.path("solstice-discovery.json"))
        await hass.async_add_executor_job(lambda: target.write_text(json.dumps(report, indent=2)))
    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, assign_showcase_areas)
    return True
