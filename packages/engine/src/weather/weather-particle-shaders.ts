const shelterShader = /* glsl */ `
  uniform sampler2D shelter;
  uniform vec4 shelterBounds;
  float shelterHeight(vec2 p) {
    vec2 uv = (p - shelterBounds.xy) / shelterBounds.zw;
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return -0.06;
    return texture2D(shelter, uv).r;
  }
`;
export const weatherParticleVertex = /* glsl */ `
  attribute vec4 seed;
  uniform float time;
  uniform float kind;
  uniform float amount;
  uniform float particleScale;
  uniform float top;
  uniform float span;
  uniform vec2 center;
  uniform vec2 wind;
  varying vec2 particleUv;
  varying vec3 worldPoint;
  varying float strength;
  ${shelterShader}
  void main() {
    particleUv = uv;
    float cycle = fract(seed.y + time * (kind < 0.5 ? 0.55 : kind < 1.5 ? 0.09 : 0.4) * (0.7 + seed.w * 0.6));
    vec2 anchor = floor(center / 4.0) * 4.0;
    vec2 offset = (seed.xz - 0.5) * span;
    vec2 horizontal = mod(offset + wind * time - anchor + span * 0.5, span) - span * 0.5 + anchor;
    float y = mix(top, -0.1, cycle);
    if (kind > 2.5) y = kind < 3.5 ? 0.35 + seed.y * 1.4 : 1.0 + seed.y * 5.0;
    vec3 point = vec3(horizontal.x, y, horizontal.y);
    if (kind > 0.5 && kind < 1.5) point.xz += vec2(sin(time * 0.8 + seed.w * 80.0), cos(time * 0.6 + seed.w * 30.0)) * 0.25;
    strength = smoothstep(seed.w - 0.08, seed.w + 0.08, amount);
    strength *= smoothstep(0.0, 1.5, span * 0.5 - max(abs(point.x - center.x), abs(point.z - center.y)));
    float ground = shelterHeight(point.xz);
    strength *= step(ground + 0.12, point.y);
    // Reject wind-driven paths that have already passed through a shelter.
    if (kind < 2.5) for (int i = 1; i <= 4; i++) {
      float back = float(i) * 0.25 * cycle;
      vec2 previous = point.xz - wind * back * (kind < 0.5 ? 1.8 : kind < 1.5 ? 11.0 : 2.5);
      strength *= step(shelterHeight(previous) + 0.12, point.y + back * top);
    }
    worldPoint = point;
    vec4 view = viewMatrix * vec4(point, 1.0);
    float width = kind < 0.5 ? 0.025 : kind < 1.5 ? 0.075 + seed.w * 0.055 : kind < 2.5 ? 0.065 : kind < 3.5 ? 5.0 : 2.8;
    float height = kind < 0.5 ? 0.36 + seed.w * 0.25 : kind < 2.5 ? width : kind < 3.5 ? 1.4 : 0.18;
    width *= particleScale;
    height *= particleScale;
    vec2 local = position.xy;
    if (kind > 0.5 && kind < 2.5) {
      float a = time * (0.4 + seed.w) + seed.x * 20.0;
      local = mat2(cos(a), -sin(a), sin(a), cos(a)) * local;
    }
    view.xy += local * vec2(width, height);
    if (kind < 0.5) view.x += position.y * wind.x * 0.025;
    worldPoint = point + vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]) * local.x * width + vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]) * local.y * height;
    gl_Position = projectionMatrix * view;
  }
`;
export const weatherParticleFragment = /* glsl */ `
  uniform float kind;
  uniform float daylight;
  varying vec2 particleUv;
  varying vec3 worldPoint;
  varying float strength;
  ${shelterShader}
  void main() {
    if (worldPoint.y < shelterHeight(worldPoint.xz) + 0.08) discard;
    vec2 p = particleUv * 2.0 - 1.0;
    float alpha;
    if (kind < 0.5) alpha = (1.0 - smoothstep(0.1, 1.0, abs(p.x))) * (1.0 - smoothstep(0.65, 1.0, abs(p.y))) * 0.72;
    else if (kind < 2.5) alpha = 1.0 - smoothstep(0.55, 0.95, length(p));
    else if (kind < 3.5) alpha = pow(max(0.0, 1.0 - dot(p, p)), 2.0) * 0.12;
    else alpha = (1.0 - smoothstep(0.12, 0.3, abs(p.y - sin(p.x * 3.0) * 0.35))) * (1.0 - smoothstep(0.5, 1.0, abs(p.x))) * 0.2;
    alpha *= strength;
    if (alpha < 0.005) discard;
    vec3 tint = kind < 0.5 ? vec3(0.57, 0.73, 0.8) : vec3(0.86, 0.91, 0.94);
    tint *= mix(0.38, 1.0, daylight);
    gl_FragColor = vec4(tint, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
