export const walkSkyVertexShader = /* glsl */ `
  varying vec3 skyDirection;
  void main() {
    skyDirection = position;
    vec4 clip = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
    gl_Position = clip.xyww;
  }
`;

export const walkSkyFragmentShader = /* glsl */ `
  uniform vec3 sunDirection;
  uniform vec3 sunColor;
  uniform vec3 zenithDay;
  uniform vec3 horizonDay;
  uniform vec3 zenithNight;
  uniform vec3 horizonNight;
  uniform vec3 duskColor;
  uniform float daylight;
  uniform float overcast;
  varying vec3 skyDirection;
  void main() {
    vec3 direction = normalize(skyDirection);
    float height = smoothstep(-0.08, 0.85, direction.y);
    vec3 zenith = mix(zenithNight, zenithDay, daylight);
    vec3 horizon = mix(horizonNight, horizonDay, daylight);
    float alignment = max(dot(direction, sunDirection), 0.0);
    float dusk = (1.0 - smoothstep(0.0, 0.3, abs(sunDirection.y))) * daylight;
    horizon = mix(horizon, duskColor, dusk * pow(alignment, 3.0) * 0.65);
    vec3 sky = mix(horizon, zenith, height);
    sky = mix(sky, mix(vec3(0.06, 0.09, 0.15), vec3(0.46, 0.56, 0.64), daylight), overcast * 0.65);
    float visibility = (1.0 - overcast) * smoothstep(-0.015, 0.025, sunDirection.y);
    float disk = smoothstep(0.99980, 0.99988, dot(direction, sunDirection));
    float glow = pow(alignment, 180.0) * 0.12;
    sky = mix(sky, sunColor, clamp((disk + glow) * visibility, 0.0, 1.0));
    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
