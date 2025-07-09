const BASE = import.meta.env.VITE_API_URL;

const j = <T>(url: string, opt?: RequestInit) =>
  fetch(url, opt).then(r => r.ok ? r.json() as Promise<T> : Promise.reject(r));

export const api = {
  /* --- movimientos ------------------------------------------------------ */
  move:   (id: number, angle: number) =>
    j<{servo_id: number; angle_deg: number}>(`${BASE}/move`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id, angle })
    }),

  stop:   () => j<{status: string}>(`${BASE}/stop`,   { method: 'POST' }),
  resume: () => j<{status: string}>(`${BASE}/resume`, { method: 'POST' }),
  reset:  () => j<{status: string}>(`${BASE}/reset`,  { method: 'POST' }),

  /* --- lectura de estado ------------------------------------------------ */
  inspect:(id: number) =>
    j<{
      position_deg: number; voltage_v: number; temperature_c: number;
      load: string; speed_rpm: number | null; torque_enabled: boolean;
    }>(`${BASE}/inspect/${id}`),

  status: () => j<{status: string; time: number}>(`${BASE}/status`)
};
