import Constants from 'expo-constants';

const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/worker`;
  }
  return 'http://localhost:3000/api/worker';
};

const API_URL = getBaseUrl();

export type WorkerTicket = {
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

export type WorkerComment = {
  id: string;
  ticket_id: string;
  worker_id: string;
  comment: string;
  created_at: string;
};

export const workerService = {
  async getMyTickets(token: string): Promise<{ tickets: WorkerTicket[] }> {
    const response = await fetch(`${API_URL}/tickets`, {
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

  async getTicketById(token: string, id: string): Promise<{ ticket: WorkerTicket }> {
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

  async markInProgress(token: string, id: string): Promise<{ ticket: WorkerTicket; message: string }> {
    const response = await fetch(`${API_URL}/tickets/${id}/start`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async addComment(token: string, id: string, comment: string): Promise<{ comment: WorkerComment; message: string }> {
    const response = await fetch(`${API_URL}/tickets/${id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ comment }),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async uploadCompletionPhoto(
    token: string,
    id: string,
    photo: { uri: string; name: string; type: string },
  ): Promise<{ ticket: WorkerTicket; message: string }> {
    const form = new FormData();
    form.append('photo', {
      uri: photo.uri,
      name: photo.name,
      type: photo.type,
    } as any);
    const response = await fetch(`${API_URL}/tickets/${id}/complete`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },
};
