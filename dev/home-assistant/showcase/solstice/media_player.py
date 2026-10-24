from homeassistant.components.demo.media_player import DemoTVShowPlayer, DemoMusicPlayer

async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    tv = DemoTVShowPlayer()
    tv._attr_name = "Solstice TV"
    tv._attr_unique_id = "solstice_tv"
    speaker = DemoMusicPlayer("Solstice Speaker")
    speaker._attr_unique_id = "solstice_speaker"
    async_add_entities([tv, speaker])
