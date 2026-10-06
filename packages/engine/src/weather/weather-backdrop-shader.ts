export const weatherBackdropFragment = /* glsl */ `
  varying vec2 backdropUv;
  uniform float time, daylight, darkness, coverage, mist, rain, aspect;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
      mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float cloud(vec2 p) {
    float sum = 0.0, weight = 0.5;
    for (int i=0; i<5; i++) { sum += noise(p)*weight; p = p*2.03 + vec2(7.2, 3.9); weight *= 0.5; }
    return sum;
  }
  void main() {
    vec2 uv = backdropUv;
    vec2 p = vec2(uv.x*aspect, uv.y);
    vec2 drift = vec2(time*0.007, time*0.002);
    float billow = cloud(p*3.1 + drift + vec2(12.0, 8.0));
    float detail = cloud(p*7.0 - drift*0.7 + billow*1.8);
    float banks = smoothstep(0.24, 0.77, billow*0.7 + detail*0.3);
    float storm = smoothstep(0.15, 0.7, darkness);
    vec3 pale = mix(vec3(0.09,0.13,0.20), vec3(0.61,0.69,0.75), daylight);
    vec3 charcoal = mix(vec3(0.012,0.022,0.042), vec3(0.025,0.038,0.065), daylight);
    vec3 silver = mix(vec3(0.07,0.10,0.16), vec3(0.14,0.18,0.24), daylight);
    vec3 color = mix(pale, mix(charcoal, silver, banks), storm);
    // Broad illuminated pockets and a shaded perimeter give the diorama depth.
    float opening = exp(-dot((uv-vec2(0.48,0.48))*vec2(1.5,1.0), (uv-vec2(0.48,0.48))*vec2(1.5,1.0))*4.0);
    color += vec3(0.045,0.055,0.07)*opening*storm;
    color *= 1.0 - smoothstep(0.25,0.9,length(uv-0.5))*0.4*storm;
    color = mix(color, pale, mist*(0.06 + banks*0.12));
    // Distant rain belongs behind the building, separate from sheltered world particles.
    vec2 streakUv = vec2(p.x + p.y*0.24, p.y);
    float column = floor(streakUv.x*340.0);
    float seed = hash(vec2(column, 3.0));
    float streak = pow(max(0.0, 1.0-abs(fract(streakUv.x*340.0)-0.5)*2.0), 10.0);
    streak *= pow(fract(streakUv.y*(8.0+seed*9.0)+time*(1.2+seed)+seed*17.0), 14.0);
    color += vec3(0.18,0.22,0.27)*streak*rain;
    gl_FragColor = vec4(color, clamp(coverage*1.3 + mist,0.0,1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
