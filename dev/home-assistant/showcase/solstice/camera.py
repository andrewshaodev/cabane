from homeassistant.components.demo.camera import DemoCamera

async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    cameras = []
    for key, name in [("solstice_garden_camera", "Solstice Garden Camera"), ("solstice_gallery_camera", "Solstice Gallery Camera")]:
        camera = DemoCamera(name, "image/jpeg")
        camera._attr_unique_id = key
        cameras.append(camera)
    async_add_entities(cameras)
