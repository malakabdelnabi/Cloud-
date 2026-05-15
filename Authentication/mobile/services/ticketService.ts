import Constants from 'expo-constants';

const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/tickets`;
  }
  return 'http://localhost:3000/api/tickets';
};

const API_URL = getBaseUrl();

export type NewTicket = {
  description: string;
  category: string;
  location: string;
  priority?: string;
  imageUri: string;
  imageName?: string;
  imageType?: string;
};

export const ticketService = {
  async createTicket(token: string, ticket: NewTicket) {
    const formData = new FormData();
    formData.append('description', ticket.description);
    formData.append('category', ticket.category);
    formData.append('location', ticket.location);
    if (ticket.priority) formData.append('priority', ticket.priority);

    const filename = ticket.imageName || ticket.imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = ticket.imageType || (match ? `image/${match[1]}` : 'image/jpeg');

    formData.append('image', {
      uri: ticket.imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  async getMyTickets(token: string) {
    const response = await fetch(API_URL, {
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

  async getTicketById(token: string, id: string) {
    const response = await fetch(`${API_URL}/${id}`, {
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
};
