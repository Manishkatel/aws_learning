/**
 * Django API Client Configuration
 * 
 * Set your Django backend URL here
 * For development: http://localhost:8000
 * For production: https://your-django-backend.com
 */
export const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login/',
  SIGNUP: '/api/auth/signup/',
  LOGOUT: '/api/auth/logout/',
  REFRESH_TOKEN: '/api/auth/token/refresh/',
  USER_PROFILE: '/api/auth/profile/',
  
  // Clubs
  CLUBS: '/api/clubs/',
  CLUB_DETAIL: (id: string) => `/api/clubs/${id}/`,
  MY_CLUBS: '/api/clubs/my-clubs/',
  CLUB_UPLOAD_LOGO: (id: string) => `/api/clubs/${id}/upload-logo/`,
  
  // Club Members
  CLUB_MEMBERS: '/api/clubs/club-members/',
  CLUB_MEMBER_DETAIL: (id: string) => `/api/clubs/club-members/${id}/`,
  
  // Board Members
  BOARD_MEMBERS: '/api/clubs/board-members/',
  BOARD_MEMBER_DETAIL: (id: string) => `/api/clubs/board-members/${id}/`,
  BOARD_MEMBER_UPLOAD_PHOTO: (id: string) => `/api/clubs/board-members/${id}/upload_photo/`,
  
  // Achievements
  ACHIEVEMENTS: '/api/clubs/achievements/',
  ACHIEVEMENT_DETAIL: (id: string) => `/api/clubs/achievements/${id}/`,
  
  // Club Applications
  CLUB_APPLICATIONS: '/api/clubs/club-applications/',
  CLUB_APPLICATION_DETAIL: (id: string) => `/api/clubs/club-applications/${id}/`,
  
  // Events
  EVENTS: '/api/events/',
  EVENT_DETAIL: (id: string) => `/api/events/${id}/`,
  MY_EVENTS: '/api/events/my-events/',
  EVENT_REGISTER: (id: string) => `/api/events/${id}/register/`,
  
  // Event Attendees
  EVENT_ATTENDEES: '/api/events/event-attendees/',
  
  // Event Stars
  EVENT_STARS: '/api/events/event-stars/',
  EVENT_STAR_DETAIL: (id: string) => `/api/events/event-stars/${id}/`,
  
  // Profile
  UPDATE_PROFILE: '/api/profile/update/',
  UPLOAD_PROFILE_PICTURE: '/api/profile/upload-picture/',
};

/**
 * Get authorization headers with JWT token
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('django_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Get authorization headers for file upload
 */
export const getAuthHeadersForUpload = (): HeadersInit => {
  const token = localStorage.getItem('django_access_token');
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Handle API response with proper error handling
 */
async function handleResponse<T>(response: Response, url?: string): Promise<T> {
  if (!response.ok) {
    // Try to parse error message
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    // Handle Django REST Framework validation errors
    let errorMessage = 'API request failed';
    if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = errorData.error;
    } else if (typeof errorData === 'object') {
      // Handle field-specific validation errors
      const fieldErrors: string[] = [];
      for (const [field, messages] of Object.entries(errorData)) {
        if (Array.isArray(messages)) {
          fieldErrors.push(`${field}: ${messages.join(', ')}`);
        } else if (typeof messages === 'string') {
          fieldErrors.push(`${field}: ${messages}`);
        } else if (typeof messages === 'object') {
          fieldErrors.push(`${field}: ${JSON.stringify(messages)}`);
        }
      }
      if (fieldErrors.length > 0) {
        errorMessage = fieldErrors.join('; ');
      }
    }
    
    // Add URL and status to error for debugging
    if (response.status === 404) {
      errorMessage = `Not Found (404): ${url || 'Unknown URL'}. ${errorMessage}`;
    }
    
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      errorData: errorData,
      message: errorMessage
    });
    
    throw new Error(errorMessage);
  }
  
  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}

/**
 * Make GET request to Django API with automatic token refresh
 */
export async function apiGet<T>(endpoint: string, retry: boolean = true): Promise<T> {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${DJANGO_API_URL}${normalizedEndpoint}`;
  
  console.log(`GET Request to: ${url}`); // Log the full URL
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  console.log(`GET Response status: ${response.status} for ${url}`); // Log response status
  
  // If 401 and retry is enabled, try refreshing token and retrying once
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      const retryResponse = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      console.log(`GET Retry Response status: ${retryResponse.status} for ${url}`);
      return handleResponse<T>(retryResponse, url);
    }
  }
  
  return handleResponse<T>(response, url);
}

/**
 * Make POST request to Django API with automatic token refresh
 */
export async function apiPost<T>(endpoint: string, data: any, retry: boolean = true): Promise<T> {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${DJANGO_API_URL}${normalizedEndpoint}`;
  
  console.log('POST Request:', {
    url: url,
    endpoint: normalizedEndpoint,
    data: data
  });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  // If 401 and retry is enabled, try refreshing token and retrying once
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      const retryResponse = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<T>(retryResponse, url);
    }
  }
  
  return handleResponse<T>(response, url);
}

/**
 * Make PUT request to Django API with automatic token refresh
 */
export async function apiPut<T>(endpoint: string, data: any, retry: boolean = true): Promise<T> {
  const response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  // If 401 and retry is enabled, try refreshing token and retrying once
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      const retryResponse = await fetch(`${DJANGO_API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<T>(retryResponse);
    }
  }
  
  return handleResponse<T>(response);
}

/**
 * Make PATCH request to Django API with automatic token refresh
 */
export async function apiPatch<T>(endpoint: string, data: any, retry: boolean = true): Promise<T> {
  const response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  // If 401 and retry is enabled, try refreshing token and retrying once
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      const retryResponse = await fetch(`${DJANGO_API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<T>(retryResponse);
    }
  }
  
  return handleResponse<T>(response);
}

/**
 * Make DELETE request to Django API with automatic token refresh
 */
export async function apiDelete<T>(endpoint: string, retry: boolean = true): Promise<T> {
  const response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }
  
  // If 401 and retry is enabled, try refreshing token and retrying once
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      const retryResponse = await fetch(`${DJANGO_API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (retryResponse.status === 204) {
        return {} as T;
      }
      
      return handleResponse<T>(retryResponse);
    }
  }
  
  return handleResponse<T>(response);
}

/**
 * Upload file to Django API with automatic token refresh
 */
export async function apiUploadFile<T>(endpoint: string, file: File, fieldName: string = 'file', retry: boolean = true): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);
  
  const response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeadersForUpload(),
    body: formData,
  });
  
  // If 401 and retry is enabled, try refreshing token and retrying once
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      const retryResponse = await fetch(`${DJANGO_API_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeadersForUpload(),
        body: formData,
      });
      return handleResponse<T>(retryResponse);
    }
  }
  
  return handleResponse<T>(response);
}

/**
 * Refresh JWT access token
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem('django_refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${DJANGO_API_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('django_access_token', data.access);
      
      // Update refresh token if provided
      if (data.refresh) {
        localStorage.setItem('django_refresh_token', data.refresh);
      }
      
      return true;
    }
    
    // If refresh fails, clear tokens
    localStorage.removeItem('django_access_token');
    localStorage.removeItem('django_refresh_token');
    localStorage.removeItem('django_user');
    
    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear tokens on error
    localStorage.removeItem('django_access_token');
    localStorage.removeItem('django_refresh_token');
    localStorage.removeItem('django_user');
    return false;
  }
}
