'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type TileId = 'cpu' | 'memory' | 'disk' | 'load' | 'dockerSummary';

type TilesState = Record<TileId, boolean>;

type State = {
  intervalMs: number;
  tiles: TilesState;
  /** Orden global persistido de todos los tiles (visibles o no) */
  order: TileId[];

  setInterval: (ms: number) => void;
  toggle: (id: TileId) => void;

  /** Reemplaza el orden actual con `ids` (solo ids válidos) */
  setOrder: (ids: string[]) => void;
  /** Asegura que `order` contenga exactamente `all` (respetando el orden previo) */
  ensureIds: (all: TileId[]) => void;
};

const ALL_IDS: TileId[] = ['cpu', 'memory', 'disk', 'load', 'dockerSummary'];

export const useDashboardPrefs = create<State>()(
  persist(
    (set, get) => ({
      intervalMs: 10000,
      tiles: { cpu: true, memory: true, disk: true, load: true, dockerSummary: true },
      order: [...ALL_IDS],

      setInterval: (ms) => set({ intervalMs: ms }),

      toggle: (id) => {
        const tiles = { ...get().tiles, [id]: !get().tiles[id] };
        let order = [...get().order];

        // si se enciende, lo agregamos al final si no está
        if (tiles[id] && !order.includes(id)) order = [...order, id];
        // si se apaga, mantenemos el id en order (para recordar su posición histórica),
        // pero si prefieres eliminarlo, descomenta la siguiente línea:
        // if (!tiles[id]) order = order.filter(x => x !== id as string);

        set({ tiles, order });
      },

      setOrder: (ids) => {
        // Normalizamos y filtramos a ids válidos
        const valid = ids.filter((x): x is TileId => (ALL_IDS as string[]).includes(x));
        // Agregamos cualquier id faltante al final (no romper si viene algo incompleto)
        const missing = ALL_IDS.filter((id) => !valid.includes(id));
        set({ order: [...valid, ...missing] });
      },

      ensureIds: (all) => {
        const cur = get().order;
        // Conserva orden de los que existían
        const keep = cur.filter((id) => (all as string[]).includes(id));
        // Añade los nuevos al final
        const missing = all.filter((id) => !keep.includes(id));
        set({ order: [...keep, ...missing] });
      },
    }),
    {
      name: 'dashboard-prefs',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // optional: migraciones si cambias keys en el futuro
    }
  )
);
