struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  life: f32,
  size: f32,
  rotation: f32,
  _padding: f32,
}

struct Uniforms {
  viewProjection: mat4x4<f32>,
  deltaTime: f32,
  time: f32,
  gravity: vec3<f32>,
  _padding: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

@compute @workgroup_size(256)
fn update_particles(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= arrayLength(&particles)) {
    return;
  }
  
  var particle = particles[index];
  
  if (particle.life <= 0.0) {
    return;
  }
  
  let dt = uniforms.deltaTime;
  particle.velocity += uniforms.gravity * dt;
  particle.position += particle.velocity * dt;
  particle.life -= dt;
  particle.rotation += 2.0 * dt;
  
  particle.velocity *= 0.98;
  
  if (particle.position.y < 0.0) {
    particle.position.y = 0.0;
    particle.velocity.y *= -0.3;
    particle.velocity.x *= 0.7;
    particle.velocity.z *= 0.7;
  }
  
  particles[index] = particle;
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
}

@vertex
fn vs_main(
  @location(0) quad_pos: vec2<f32>,
  @location(1) particle_index: u32,
) -> VertexOutput {
  var output: VertexOutput;
  
  let particle = particles[particle_index];
  
  if (particle.life <= 0.0) {
    output.position = vec4<f32>(0.0, 0.0, -10.0, 1.0);
    return output;
  }
  
  let world_pos = particle.position;
  let size = particle.size * (particle.life / 1.0);
  
  let right = vec3<f32>(1.0, 0.0, 0.0);
  let up = vec3<f32>(0.0, 1.0, 0.0);
  
  let vertex_world = world_pos + right * quad_pos.x * size + up * quad_pos.y * size;
  output.position = uniforms.viewProjection * vec4<f32>(vertex_world, 1.0);
  
  output.uv = quad_pos * 0.5 + 0.5;
  
  let alpha = particle.life / 1.0;
  output.color = vec4<f32>(0.35, 0.25, 0.15, alpha);
  
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let center_dist = length(input.uv - vec2<f32>(0.5));
  let fade = 1.0 - smoothstep(0.3, 0.5, center_dist);
  
  var color = input.color;
  color.a *= fade;
  
  return color;
}
