export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function isoDate(date: Date): string {
  return new Date(date).toISOString().split("T")[0];
}
