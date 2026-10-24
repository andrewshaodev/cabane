from homeassistant.components.demo.lock import DemoLock

async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    lock = DemoLock("Solstice Entry Lock", "locked", openable=True)
    lock._attr_unique_id = "solstice_entry_lock"
    async_add_entities([lock])
