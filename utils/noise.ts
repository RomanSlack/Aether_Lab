/*
 * A fast, standalone Simplex Noise implementation.
 * Standard algorithm for 2D noise.
 */

const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

const p = new Uint8Array(256);
const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);

// Initialize with a specific seed
export const seedNoise = (seed: number) => {
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }
  // Shuffle using the seed
  let n = seed;
  for (let i = 255; i > 0; i--) {
    n = (n * 1664525 + 1013904223) % 4294967296;
    const r = (n >>> 0) % (i + 1);
    const t = p[i];
    p[i] = p[r];
    p[r] = t;
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }
};

// Initial seed
seedNoise(Date.now());

const grad3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
  1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
  0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
]);

export const simplex2 = (xin: number, yin: number): number => {
  let n0 = 0, n1 = 0, n2 = 0; // Noise contributions from the three corners
  // Skew the input space to determine which simplex cell we're in
  const s = (xin + yin) * F2; // Hairy factor for 2D
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const t = (i + j) * G2;
  const X0 = i - t; // Unskew the cell origin back to (x,y) space
  const Y0 = j - t;
  const x0 = xin - X0; // The x,y distances from the cell origin
  const y0 = yin - Y0;

  // For the 2D case, the simplex shape is an equilateral triangle.
  // Determine which simplex we are in.
  let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
  if (x0 > y0) { i1 = 1; j1 = 0; } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
  else { i1 = 0; j1 = 1; }      // upper triangle, YX order: (0,0)->(0,1)->(1,1)

  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
  // c = (3-sqrt(3))/6
  const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
  const y2 = y0 - 1.0 + 2.0 * G2;

  // Work out the hashed gradient indices of the three simplex corners
  const ii = i & 255;
  const jj = j & 255;
  const gi0 = permMod12[ii + perm[jj]];
  const gi1 = permMod12[ii + i1 + perm[jj + j1]];
  const gi2 = permMod12[ii + 1 + perm[jj + 1]];

  // Calculate the contribution from the three corners
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 < 0) n0 = 0.0;
  else {
    t0 *= t0;
    n0 = t0 * t0 * (grad3[gi0 * 3] * x0 + grad3[gi0 * 3 + 1] * y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 < 0) n1 = 0.0;
  else {
    t1 *= t1;
    n1 = t1 * t1 * (grad3[gi1 * 3] * x1 + grad3[gi1 * 3 + 1] * y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 < 0) n2 = 0.0;
  else {
    t2 *= t2;
    n2 = t2 * t2 * (grad3[gi2 * 3] * x2 + grad3[gi2 * 3 + 1] * y2);
  }

  // Add contributions from each corner to get the final noise value.
  // The result is scaled to return values in the interval [-1,1].
  return 70.0 * (n0 + n1 + n2);
};

/**
 * Domain warping function to create fluid-like patterns
 */
export const fbm = (x: number, y: number, octaves: number, persistence: number, lacunarity: number): number => {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;  // Used for normalizing result to 0.0 - 1.0
    for(let i=0; i<octaves; i++) {
        total += simplex2(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return total / maxValue;
}

/**
 * Pattern generation using domain warping
 * f(p) = fbm( p + fbm( p + fbm(p) ) )
 */
export const pattern = (x: number, y: number, scale: number, distortion: number, qX: number, qY: number): number => {
    const q = fbm(x * scale + qX, y * scale + qY, 4, 0.5, 2.0);
    const r = fbm(x * scale + 4.0 * q + 20, y * scale + 4.0 * q + 20, 4, 0.5, 2.0);
    return fbm(x * scale + distortion * r, y * scale + distortion * r, 4, 0.5, 2.0);
}
