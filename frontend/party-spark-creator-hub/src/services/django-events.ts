import { apiGet, apiPost, apiPut, apiDelete, API_ENDPOINTS } from './django-api';

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  event_time: string;
  location: string;
  is_virtual: boolean;
  price: number;
  max_attendees?: number;
  club_id: string;
  club_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  event_time: string;
  location: string;
  is_virtual: boolean;
  price: number;
  max_attendees?: number;
  club_id: string;
}

/**
 * Get all events with optional filters
 */
export async function getEvents(filters?: {
  event_type?: string;
  search?: string;
  is_free?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<Event[]> {
  let endpoint = API_ENDPOINTS.EVENTS;
  
  if (filters) {
    const params = new URLSearchParams();
    if (filters.event_type) params.append('event_type', filters.event_type);
    if (filters.search) params.append('search', filters.search);
    if (filters.is_free !== undefined) params.append('is_free', filters.is_free.toString());
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;
  }
  
  const response = await apiGet<any>(endpoint);
  
  // Handle paginated response from Django REST Framework
  // Response can be either an array or an object with 'results' key
  if (Array.isArray(response)) {
    return response;
  } else if (response && typeof response === 'object' && Array.isArray(response.results)) {
    return response.results;
  } else {
    return [];
  }
}

/**
 * Get single event by ID
 */
export async function getEvent(id: string): Promise<Event> {
  return apiGet<Event>(API_ENDPOINTS.EVENT_DETAIL(id));
}

/**
 * Get events created by current user
 */
export async function getMyEvents(): Promise<Event[]> {
  const response = await apiGet<any>(API_ENDPOINTS.MY_EVENTS);
  
  // Handle paginated response from Django REST Framework
  // Response can be either an array or an object with 'results' key
  if (Array.isArray(response)) {
    return response;
  } else if (response && typeof response === 'object' && Array.isArray(response.results)) {
    return response.results;
  } else {
    return [];
  }
}

/**
 * Create new event
 */
export async function createEvent(data: CreateEventData): Promise<Event> {
  return apiPost<Event>(API_ENDPOINTS.EVENTS, data);
}

/**
 * Update event
 */
export async function updateEvent(id: string, data: Partial<CreateEventData>): Promise<Event> {
  return apiPut<Event>(API_ENDPOINTS.EVENT_DETAIL(id), data);
}

/**
 * Delete event
 */
export async function deleteEvent(id: string): Promise<void> {
  return apiDelete(API_ENDPOINTS.EVENT_DETAIL(id));
}

/**
 * Register for event
 */
export async function registerForEvent(id: string): Promise<{ message: string }> {
  return apiPost<{ message: string }>(API_ENDPOINTS.EVENT_REGISTER(id), {});
}

// ==================== Event Attendees ====================

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  registered_at?: string;
}

export interface CreateEventAttendeeData {
  event_id: string;
}

/**
 * Get event attendees (optionally filtered by event_id)
 */
export async function getEventAttendees(eventId?: string): Promise<EventAttendee[]> {
  let endpoint = API_ENDPOINTS.EVENT_ATTENDEES;
  if (eventId) {
    endpoint += `?event_id=${eventId}`;
  }
  const response = await apiGet<any>(endpoint);
  
  // Handle paginated response from Django REST Framework
  if (Array.isArray(response)) {
    return response;
  } else if (response && typeof response === 'object' && Array.isArray(response.results)) {
    return response.results;
  } else {
    return [];
  }
}

/**
 * Add event attendee (alternative to registerForEvent, if needed)
 */
export async function addEventAttendee(data: CreateEventAttendeeData): Promise<EventAttendee> {
  return apiPost<EventAttendee>(API_ENDPOINTS.EVENT_ATTENDEES, data);
}

// ==================== Event Stars ====================

export interface EventStar {
  id: string;
  event_id: string;
  user_id: string;
  created_at?: string;
}

/**
 * Get starred events for current user
 */
export async function getStarredEvents(): Promise<EventStar[]> {
  const response = await apiGet<any>(API_ENDPOINTS.EVENT_STARS);
  
  // Handle paginated response from Django REST Framework
  if (Array.isArray(response)) {
    return response;
  } else if (response && typeof response === 'object' && Array.isArray(response.results)) {
    return response.results;
  } else {
    return [];
  }
}

/**
 * Star an event
 */
export async function starEvent(eventId: string): Promise<EventStar> {
  return apiPost<EventStar>(API_ENDPOINTS.EVENT_STARS, { event: eventId });
}

/**
 * Unstar an event
 */
export async function unstarEvent(starId: string): Promise<void> {
  return apiDelete(API_ENDPOINTS.EVENT_STAR_DETAIL(starId));
}