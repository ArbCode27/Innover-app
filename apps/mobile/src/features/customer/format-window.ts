const formatTime = (date: Date) =>
  date.toLocaleTimeString("es-VE", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatDate = (date: Date) =>
  date.toLocaleDateString("es-VE", {
    timeZone: "America/Caracas",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export type TicketWindowBreakdown = {
  dateLabel: string;
  hoursLabel: string;
  isToday: boolean;
};

export const formatTicketWindowBreakdown = (
  windowStart: string | null,
  windowEnd: string | null,
): TicketWindowBreakdown | null => {
  if (!windowStart && !windowEnd) {
    return null;
  }

  const start = windowStart ? new Date(windowStart) : null;
  const end = windowEnd ? new Date(windowEnd) : null;

  const validStart = start && !isNaN(start.getTime());
  const validEnd = end && !isNaN(end.getTime());

  if (!validStart && !validEnd) {
    return null;
  }

  const baseDate = validStart ? start! : end!;
  const today = new Date();
  const isToday =
    baseDate.getDate() === today.getDate() &&
    baseDate.getMonth() === today.getMonth() &&
    baseDate.getFullYear() === today.getFullYear();

  const rawDateStr = formatDate(baseDate);
  const capitalizedDate =
    rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1);
  const dateLabel = isToday ? `Hoy, ${capitalizedDate}` : capitalizedDate;

  let hoursLabel = "";
  if (validStart && validEnd) {
    hoursLabel = `${formatTime(start!)} — ${formatTime(end!)}`;
  } else if (validStart) {
    hoursLabel = `Desde las ${formatTime(start!)}`;
  } else {
    hoursLabel = `Hasta las ${formatTime(end!)}`;
  }

  return {
    dateLabel,
    hoursLabel,
    isToday,
  };
};

export const formatTicketWindow = (
  windowStart: string | null,
  windowEnd: string | null,
): string | null => {
  const breakdown = formatTicketWindowBreakdown(windowStart, windowEnd);
  if (!breakdown) {
    return null;
  }
  return `${breakdown.dateLabel} (${breakdown.hoursLabel})`;
};

export const formatTicketInstant = (iso: string | null): string | null => {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const rawDateStr = formatDate(date);
  const capitalizedDate =
    rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1);
  return `${capitalizedDate} · ${formatTime(date)}`;
};
