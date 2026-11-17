/**
 * Calcula coordenadas visuais `[lng, lat]` com pequeno deslocamento circular apenas quando
 * dois ou mais itens compartilham praticamente a mesma coordenada (~10 m), evitando
 * sobreposição de pinos nos mapas sem alterar as coordenadas reais dos dados.
 */
export function buildVisualCoordinatesMap<T>(
  items: readonly T[],
  getId: (item: T) => string,
  getLat: (item: T) => number,
  getLng: (item: T) => number,
  offsetDeg = 0.00045,
): Map<string, [number, number]> {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = `${getLat(item).toFixed(4)}:${getLng(item).toFixed(4)}`;
    const list = buckets.get(key);
    if (list) {
      list.push(item);
    } else {
      buckets.set(key, [item]);
    }
  }

  const coordsMap = new Map<string, [number, number]>();

  for (const group of buckets.values()) {
    if (group.length === 1) {
      const item = group[0];
      coordsMap.set(getId(item), [getLng(item), getLat(item)]);
      continue;
    }

    const sorted = [...group].sort((a, b) => getId(a).localeCompare(getId(b)));
    const angleStep = (2 * Math.PI) / sorted.length;

    sorted.forEach((item, index) => {
      const angle = index * angleStep;
      const lng = getLng(item) + offsetDeg * Math.cos(angle);
      const lat = getLat(item) + offsetDeg * Math.sin(angle);
      coordsMap.set(getId(item), [lng, lat]);
    });
  }

  return coordsMap;
}
