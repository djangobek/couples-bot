export function randomBombsClient(size: number, count: number): Set<number> {
  const total = size * size;
  const result = new Set<number>();
  while (result.size < count) {
    result.add(Math.floor(Math.random() * total));
  }
  return result;
}

export function bombCountForSize(size: number): number {
  const map: Record<number, number> = {
    5: 3,
    6: 4,
    7: 5,
    8: 6,
    9: 7,
    10: 9,
  };
  return map[size] ?? 3;
}