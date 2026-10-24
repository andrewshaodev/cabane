"""Synthetic appliance switches with observable service state changes."""
from homeassistant.components.switch import SwitchEntity

async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    async_add_entities([ShowcaseSwitch(item) for item in hass.data["solstice"] if item["domain"] == "switch"])

class ShowcaseSwitch(SwitchEntity):
    _attr_should_poll = False
    def __init__(self, item):
        self._attr_name = item["name"]
        self._attr_unique_id = item["key"]
        self._attr_is_on = False
    async def async_turn_on(self, **kwargs):
        self._attr_is_on = True
        self.async_write_ha_state()
    async def async_turn_off(self, **kwargs):
        self._attr_is_on = False
        self.async_write_ha_state()
