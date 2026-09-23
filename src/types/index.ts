// ============================================================
// Common types shared across the backend
// All DTOs follow camelCase convention for JSON/API layer
// DB uses snake_case (transformed in utils/snakeCase.ts)
// ============================================================

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'technician' | 'receptionist';
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Building {
  id: number;
  name: string;
  location: string;
  created_at: string;
}

export type TicketStatus = 'pending' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  building_id: number | null;
  building_name: string | null;
  technician_name: string | null;
  attention_date: string | null;
  recommendations: string | null;
  observations: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketDocument {
  id: string;
  ticket_id: string;
  file_key: string;
  original_name: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
