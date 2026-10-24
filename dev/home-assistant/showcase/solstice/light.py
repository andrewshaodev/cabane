"""Reuse Home Assistant's official in-memory demo light implementation."""
from homeassistant.components.demo.light import DemoLight

async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    async_add_entities([
        DemoLight(unique_id=item["key"], device_name=item["name"], state=True, ct=2700, brightness=190)
        for item in hass.data["solstice"] if item["domain"] == "light"
    ])
