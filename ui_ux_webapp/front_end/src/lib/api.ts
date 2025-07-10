/* src/lib/api.ts
   Funciones para hablar con tu FastAPI.
   Ajustado para /inspect/{id} y /inspect (lista).
*/

const BASE = import.meta.env.VITE_API_URL;
const j = <T>(url: string, opt?: RequestInit) =>
  fetch(url, opt).then(r => r.ok ? r.json() as Promise<T> : Promise.reject(r));

/* ---------- Tipos ---------- */
export interface InspectData {
  servo_id:              number;
  position_deg:          number;
  position_raw:          number;
  speed_rpm:             number | null;
  load:                  string | null;   // "+26.5%" → parse en front
  voltage_v:             number | null;
  temperature_c:         number | null;
  torque_enabled:        boolean | null;
  status_return_level:   number | null;
}

export const api = {
  /* ----- movimientos ----- */
  move:   (id: number, angle: number) =>
    j<{ servo_id: number; angle_deg: number }>(`${BASE}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, angle }),
    }),

  stop:   () => j<{ status: string }>(`${BASE}/stop`,   { method: "POST" }),
  resume: () => j<{ status: string }>(`${BASE}/resume`, { method: "POST" }),
  reset:  () => j<{ status: string }>(`${BASE}/reset`,  { method: "POST" }),

  /* ----- lectura de estado ----- */
  /** Obtiene todos los parámetros de un servo */
  inspect:   (id: number) => j<InspectData>(`${BASE}/inspect/${id}`),

  /** Obtiene un array con todos los servos listados en ids */
  inspectAll: (ids: number[]) =>
    Promise.all(ids.map(api.inspect)) as Promise<InspectData[]>,

  /* ----- backend vivo ----- */
  status: () => j<{ status: string; time: number }>(`${BASE}/status`),

  /* añade debajo de move/stop… */
torque: (id: number, enable: boolean) =>
  j<{ servo_id: number; torque: boolean }>(`${BASE}/torque`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, enable }),
  }),

};
