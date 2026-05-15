import Constants from 'expo-constants';

const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/manager`;
  }
  return 'http://localhost:3000/api/manager';
};

const API_URL = getBaseUrl();

export type ManagerTicket = {
  id: string;
  reporter_id: string;
  assigned_to: string | null;
  category: string;
  description: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Resolved';
  photo_path?: string | null;
  image_url?: string | null;
  completion_photo_path?: string | null;
  completion_image_url?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at?: string;
};

export type Worker = {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at?: string;
};

export type TicketFilters = {
  status?: string;
  category?: string;
  priority?: string;
  assigned_to?: string;
};

function buildQuery(filters?: TicketFilters) {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.status)      params.set('status', filters.status);
  if (filters.category)    params.set('category', filters.category);
  if (filters.priority)    params.set('priority', filters.priority);
  if (filters.assigned_to) params.set('assigned_to', filters.assigned_to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export type TicketDetail = ManagerTicket & {
  reporter?: { id: string; name: string; email: string } | null;
  worker?: { id: string; name: string; email: string } | null;
  comments?: Array<{ id: string; ticket_id: string; body: string; created_at: string }>;
};

export const managerService = {
  async getAllTickets(token: string, filters?: TicketFilters): Promise<{ tickets: ManagerTicket[] }> {
    const response = await fetch(`${API_URL}/tickets${buildQuery(filters)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getTicketById(token: string, id: string): Promise<{ ticket: TicketDetail }> {
    const response = await fetch(`${API_URL}/tickets/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async assignTicket(
    token: string,
    id: string,
    worker_id: string,
  ): Promise<{ ticket: ManagerTicket; assigned_worker: { id: string; name: string } }> {
    const response = await fetch(`${API_URL}/tickets/${id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ worker_id }),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async updateTicketStatus(
    token: string,
    id: string,
    status: 'Pending' | 'In Progress' | 'Resolved',
    internal_notes?: string,
  ): Promise<{ ticket: ManagerTicket }> {
    const body: Record<string, string> = { status };
    if (internal_notes !== undefined) body.internal_notes = internal_notes;
    const response = await fetch(`${API_URL}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async updateTicketPriority(
    token: string,
    id: string,
    priority: 'Low' | 'Medium' | 'High' | 'Urgent',
  ): Promise<{ ticket: ManagerTicket }> {
    const response = await fetch(`${API_URL}/tickets/${id}/priority`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ priority }),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async closeTicket(
    token: string,
    id: string,
    internal_notes?: string,
  ): Promise<{ ticket: ManagerTicket }> {
    const body: Record<string, string> = {};
    if (internal_notes) body.internal_notes = internal_notes;
    const response = await fetch(`${API_URL}/tickets/${id}/close`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async addInternalNote(
    token: string,
    id: string,
    internal_notes: string,
  ): Promise<{ ticket: ManagerTicket }> {
    const response = await fetch(`${API_URL}/tickets/${id}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ internal_notes }),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async deleteTicket(token: string, id: string): Promise<void> {
    const response = await fetch(`${API_URL}/tickets/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      let payload: any = {};
      try { payload = await response.json(); } catch {}
      throw payload;
    }
  },

  async getWorkers(token: string): Promise<{ workers: Worker[] }> {
    const response = await fetch(`${API_URL}/workers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async setWorkerStatus(
    token: string,
    workerId: string,
    is_active: boolean,
  ): Promise<{ worker: Worker }> {
    const response = await fetch(`${API_URL}/workers/${workerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active }),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },
};
