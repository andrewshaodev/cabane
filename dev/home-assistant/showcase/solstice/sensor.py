"""Deterministic synthetic measurements, explicitly not physical telemetry."""
from homeassistant.components.sensor import SensorEntity

async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    async_add_entities([ShowcaseSensor(item) for item in hass.data["solstice"] if item["domain"] == "sensor"])

class ShowcaseSensor(SensorEntity):
    _attr_should_poll = False
    def __init__(self, item):
        self._attr_name = item["name"]
        self._attr_unique_id = item["key"]
        self._attr_native_value = item.get("value", 21)
        self._attr_native_unit_of_measurement = item.get("unit")
        self._attr_device_class = item.get("device_class")
