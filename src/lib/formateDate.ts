export function formatDate(value?: string | Date | null) {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;

  // Dátum formázása
  const formattedDate = date.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Idő formázása
  const formattedTime = date.toLocaleTimeString('hu-HU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Dátum és idő egyesítése
  return `${formattedDate} ${formattedTime}`;
}
