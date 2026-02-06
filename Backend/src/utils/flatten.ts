export function flattenRecord(record: any): string {
  return Object.entries(record)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value
          .map(v => typeof v === "object" ? JSON.stringify(v) : v)
          .join(", ")}`;
      }
      if (typeof value === "object" && value !== null) {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    })
    .join(". ");
}
