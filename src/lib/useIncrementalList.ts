import { useEffect, useMemo, useState } from "react";

/**
 * Renderizado incremental de listas largas (paginación en cliente).
 * Limita los nodos DOM montados inicialmente y expone `loadMore` para
 * ampliar la ventana. Reinicia la ventana cuando cambia `resetKey`
 * (p. ej. el término de búsqueda).
 */
export function useIncrementalList<T>(
  items: T[],
  pageSize = 25,
  resetKey: unknown = null,
) {
  const [count, setCount] = useState(pageSize);

  useEffect(() => {
    setCount(pageSize);
  }, [resetKey, pageSize]);

  const visibleItems = useMemo(() => items.slice(0, count), [items, count]);

  return {
    visibleItems,
    hasMore: count < items.length,
    remaining: Math.max(0, items.length - count),
    loadMore: () => setCount((c) => c + pageSize),
    reset: () => setCount(pageSize),
  };
}