// ============================================================
// Transformer between DB snake_case and API camelCase
// Transparent conversion layer for all DB rows
// ============================================================

// Map of DB columns (snake_case) to API fields (camelCase)
const snakeToCamelCache = new Map<string, string>();

function toCamel(str: string): string {
  if (snakeToCamelCache.has(str)) return snakeToCamelCache.get(str)!;
  const result = str.replace(/(_\w)/g, (match) => match[1].toUpperCase());
  snakeToCamelCache.set(str, result);
  return result;
}

// Convert a single object's keys from snake_case to camelCase
export function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> | Record<string, unknown>[] {
  if (Array.isArray(obj)) return (obj as Record<string, unknown>[]).map(snakeToCamel) as Record<string, unknown>[];
  if (obj instanceof Date) return obj.toISOString() as unknown as Record<string, unknown>;
  if (obj === null || typeof obj !== 'object') return {};

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamel(key);
    result[camelKey] = typeof value === 'object' && value !== null ? snakeToCamel(value as Record<string, unknown>) : value;
  }
  return result;
}

// Convert an array of objects
export function snakeToCamelArray(arr: Record<string, unknown>[]): Record<string, unknown>[] {
  return arr.map((item) => snakeToCamel(item) as Record<string, unknown>);
}

// For simple key mapping in SQL queries
export const columnMap = {
  // users
  user_id: 'id',
  username: 'username',
  email: 'email',
  password_hash: 'passwordHash',
  role: 'role',
  full_name: 'fullName',
  is_active: 'isActive',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  // tickets
  ticket_id: 'id',
  title: 'title',
  description: 'description',
  building_id: 'buildingId',
  building_name: 'buildingName',
  technician_name: 'technicianName',
  attention_date: 'attentionDate',
  recommendations: 'recommendations',
  observations: 'observations',
  status: 'status',
  priority: 'priority',
  created_by: 'createdBy',
  assigned_to: 'assignedTo',
  // ticket_documents
  document_id: 'id',
  file_key: 'fileKey',
  original_name: 'originalName',
  mime_type: 'mimeType',
  file_size: 'fileSize',
  uploaded_by: 'uploadedBy',
  uploaded_at: 'uploadedAt',
} as const;
