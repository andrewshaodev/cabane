export const contourFragmentShader = /* glsl */ `
  uniform sampler2D beauty;
  uniform sampler2D sceneDepth;
  uniform vec2 texel;
  uniform float nearPlane;
  uniform float farPlane;
  uniform bool perspective;
  uniform vec3 ink;
  varying vec2 vUv;
  #include <packing>
  float distanceAt(vec2 uv) {
    float d = texture2D(sceneDepth, uv).x;
    return perspective ? -perspectiveDepthToViewZ(d, nearPlane, farPlane)
                       : -orthographicDepthToViewZ(d, nearPlane, farPlane);
  }
  // Subtract the opposite slope: a continuous slanted surface is not an edge.
  // Only the foreground side of an occlusion receives ink. No normal, colour,
  // material-ID or triangle edges are used, so joined coplanar parts stay clean.
  float contour(float center, vec2 direction) {
    float ahead = distanceAt(vUv + direction);
    float behind = distanceAt(vUv - direction);
    float jump = ahead - center - abs(center - behind);
    float threshold = max(0.075, center * 0.004);
    return smoothstep(threshold, threshold * 2.0, jump);
  }
  void main() {
    vec4 surface = texture2D(beauty, vUv);
    float center = distanceAt(vUv);
    float edge = max(max(contour(center, vec2(texel.x, 0.0)),
                         contour(center, vec2(-texel.x, 0.0))),
                     max(contour(center, vec2(0.0, texel.y)),
                         contour(center, vec2(0.0, -texel.y))));
    vec3 shadedInk = mix(surface.rgb * 0.42, ink, 0.35);
    gl_FragColor = vec4(mix(surface.rgb, shadedInk, edge * 0.72), surface.a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

