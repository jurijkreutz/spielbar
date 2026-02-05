export type BrickStyle = 0 | 1 | 2;

export type Brick = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  style: BrickStyle;
  alive: boolean;
};

export type BrickLayoutConfig = {
  canvasWidth: number;
  brickPaddingX: number;
  brickGap: number;
  brickHeight: number;
  brickTopOffset: number;
};

export const LEVEL_PATTERNS = [
  ['########', '########', '########', '########'],
  ['########', '##..##..', '.##..##.', '########', '..##..##'],
  ['###..###', '########', '#..##..#', '########', '###..###', '.######.'],
  ['####....', '#####...', '.#####..', '..#####.', '...#####', '....####'],
  ['########', '#.######', '##.#####', '###.####', '####.###', '#####.##', '######.#'],
] as const;

export function countBricksInPattern(pattern: readonly string[]): number {
  let count = 0;
  pattern.forEach((row) => {
    for (let col = 0; col < row.length; col += 1) {
      if (row[col] === '#') count += 1;
    }
  });
  return count;
}

export function buildBricks(
  level: number,
  config: BrickLayoutConfig,
  patterns: readonly string[][] = LEVEL_PATTERNS
): Brick[] {
  const pattern = patterns[level - 1] || patterns[0];
  const cols = pattern[0].length;
  const brickWidth = (config.canvasWidth - config.brickPaddingX * 2 - config.brickGap * (cols - 1)) / cols;
  let id = 0;
  const bricks: Brick[] = [];
  pattern.forEach((row, rowIndex) => {
    for (let col = 0; col < cols; col += 1) {
      if (row[col] === '.') continue;
      bricks.push({
        id,
        x: config.brickPaddingX + col * (brickWidth + config.brickGap),
        y: config.brickTopOffset + rowIndex * (config.brickHeight + config.brickGap),
        width: brickWidth,
        height: config.brickHeight,
        style: ((rowIndex + col) % 3) as BrickStyle,
        alive: true,
      });
      id += 1;
    }
  });
  return bricks;
}

export function normalizeVelocity(
  vx: number,
  vy: number,
  speed: number,
  preferredDir: number = 1,
  minRatio: number = 0.22
): { vx: number; vy: number } {
  if (speed <= 0) return { vx, vy };
  let nextVx = vx;
  let nextVy = vy;
  const minComponent = speed * minRatio;
  if (Math.abs(nextVx) < minComponent) {
    const dir = nextVx === 0 ? (preferredDir || 1) : Math.sign(nextVx);
    nextVx = minComponent * dir;
  }
  if (Math.abs(nextVy) < minComponent) {
    const dir = nextVy === 0 ? -1 : Math.sign(nextVy);
    nextVy = minComponent * dir;
  }
  const scale = speed / Math.hypot(nextVx, nextVy);
  return {
    vx: nextVx * scale,
    vy: nextVy * scale,
  };
}

export function getPowerupDrop<T>(
  brickId: number,
  level: number,
  dropChance: number,
  types: readonly T[]
): T | null {
  if (types.length === 0) return null;
  const roll = (brickId * 31 + level * 17) % 100;
  if (roll >= dropChance) return null;
  return types[roll % types.length] ?? null;
}
