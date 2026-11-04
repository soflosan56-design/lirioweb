export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatValue(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value);
}
