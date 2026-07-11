/** Vietnamese number/currency/date formatting used across the app. */

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n);
}

export function fmtVND(n: number): string {
  return `${fmtNum(n)}đ`;
}

export function fmtPoints(n: number): string {
  return fmtNum(n);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${time} • ${fmtDate(iso)}`;
}

/** "31 tháng 12, 2026" — for prominent expiry notices. */
export function fmtDateLong(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}
