export const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

function twoDigits(value: number): string {
  return String(value).padStart(2, "0")
}

/** dd-Mmm-yyyy in local time, such as 14-Aug-2026. */
export function formatDayMonthYear(date: Date): string {
  return `${twoDigits(date.getDate())}-${MONTH_ABBREVIATIONS[date.getMonth()]}-${date.getFullYear()}`
}

/** dd-Mmm-yyyy HH:mm:ss in UTC, such as 14-Aug-2026 09:05:00. */
export function formatUtcDateTime(date: Date): string {
  const day = `${twoDigits(date.getUTCDate())}-${MONTH_ABBREVIATIONS[date.getUTCMonth()]}-${date.getUTCFullYear()}`
  return `${day} ${twoDigits(date.getUTCHours())}:${twoDigits(date.getUTCMinutes())}:${twoDigits(date.getUTCSeconds())}`
}

/** dd-Mmm-yyyy HH:mm:ss in local time, such as 14-Aug-2026 17:05:00. */
export function formatLocalDateTime(date: Date): string {
  const day = formatDayMonthYear(date)
  return `${day} ${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`
}
