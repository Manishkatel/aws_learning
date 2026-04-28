import { apiGet, apiPost, apiPut, apiDelete, API_ENDPOINTS, apiUploadFile } from './django-api';

export interface Club {
  id: string;
  name: string;
  description: string;
  club_type: string;
  custom_type?: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  logo?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClubData {
  name: string;
  description: string;
  club_type: string;
  custom_type?: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
}

/**
 * Get all clubs with optional filters
 */
export async function getClubs(filters?: {
  club_type?: string;
  search?: string;
  limit?: number;
}): Promise<Club[]> {
  let endpoint = API_ENDPOINTS.CLUBS;
  
  if (filters) {
    const params = new URLSearchParams();
    if (filters.club_type) params.append('club_type', filters.club_type);
    if (filters.search) params.append('search', filters.search);
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
 * Get single club by ID
 */
export async function getClub(id: string): Promise<Club> {
  return apiGet<Club>(API_ENDPOINTS.CLUB_DETAIL(id));
}

/**
 * Get clubs owned by current user
 */
export async function getMyClubs(): Promise<Club[]> {
  console.log('getMyClubs: Fetching from endpoint:', API_ENDPOINTS.MY_CLUBS);
  try {
    const response = await apiGet<any>(API_ENDPOINTS.MY_CLUBS);
    console.log('getMyClubs: Raw response:', response);
    
    // Handle paginated response from Django REST Framework
    // Response can be either an array or an object with 'results' key
    if (Array.isArray(response)) {
      console.log('getMyClubs: Response is array, length:', response.length);
      return response;
    } else if (response && typeof response === 'object' && Array.isArray(response.results)) {
      console.log('getMyClubs: Response has results array, length:', response.results.length);
      return response.results;
    } else {
      console.warn('getMyClubs: Unexpected response format:', response);
      return [];
    }
  } catch (error: any) {
    console.error('getMyClubs: Error fetching clubs:', error);
    throw error;
  }
}

/**
 * Create new club
 */
export async function createClub(data: CreateClubData): Promise<Club> {
  return apiPost<Club>(API_ENDPOINTS.CLUBS, data);
}

/**
 * Update club
 */
export async function updateClub(id: string, data: Partial<CreateClubData>): Promise<Club> {
  return apiPut<Club>(API_ENDPOINTS.CLUB_DETAIL(id), data);
}

/**
 * Delete club
 */
export async function deleteClub(id: string): Promise<void> {
  return apiDelete(API_ENDPOINTS.CLUB_DETAIL(id));
}

/**
 * Upload club logo
 */
export async function uploadClubLogo(clubId: string, file: File): Promise<{ logo_url: string }> {
  return apiUploadFile<{ logo_url: string }>(
    API_ENDPOINTS.CLUB_UPLOAD_LOGO(clubId),
    file,
    'logo'
  );
}

// ==================== Club Members ====================

export interface ClubMember {
  id: string;
  user_id: string;
  club_id: string;
  user_name?: string;
  user_email?: string;
  joined_at?: string;
}

export interface CreateClubMemberData {
  user_id: string;
  club_id: string;
}

/**
 * Get club members (optionally filtered by club_id)
 */
export async function getClubMembers(clubId?: string): Promise<ClubMember[]> {
  let endpoint = API_ENDPOINTS.CLUB_MEMBERS;
  if (clubId) {
    endpoint += `?club_id=${clubId}`;
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
 * Add club member
 */
export async function addClubMember(data: CreateClubMemberData): Promise<ClubMember> {
  return apiPost<ClubMember>(API_ENDPOINTS.CLUB_MEMBERS, data);
}

/**
 * Remove club member
 */
export async function removeClubMember(memberId: string): Promise<void> {
  return apiDelete(API_ENDPOINTS.CLUB_MEMBER_DETAIL(memberId));
}

// ==================== Board Members ====================

export interface BoardMember {
  id: string;
  club_id: string;
  name: string;
  position?: string;
  photo_url?: string;
  year_in_college?: string;
  joined_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBoardMemberData {
  club_id: string;
  name: string;
  position?: string;
  email?: string;
  photo_url?: string;
  year_in_college?: string;
  joined_date?: string;
}

/**
 * Get board members (optionally filtered by club_id)
 */
export async function getBoardMembers(clubId?: string): Promise<BoardMember[]> {
  let endpoint = API_ENDPOINTS.BOARD_MEMBERS;
  if (clubId) {
    endpoint += `?club_id=${clubId}`;
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
 * Add board member
 */
export async function addBoardMember(data: CreateBoardMemberData): Promise<BoardMember> {
  return apiPost<BoardMember>(API_ENDPOINTS.BOARD_MEMBERS, data);
}

/**
 * Update board member
 */
export async function updateBoardMember(id: string, data: Partial<CreateBoardMemberData>): Promise<BoardMember> {
  return apiPut<BoardMember>(API_ENDPOINTS.BOARD_MEMBER_DETAIL(id), data);
}

/**
 * Remove board member
 */
export async function removeBoardMember(id: string): Promise<void> {
  return apiDelete(API_ENDPOINTS.BOARD_MEMBER_DETAIL(id));
}

// ==================== Achievements ====================

export interface Achievement {
  id: string;
  club_id: string;
  title: string;
  description?: string;
  date_achieved?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAchievementData {
  club_id: string;
  title: string;
  description?: string;
  date_achieved?: string;
}

/**
 * Get achievements (optionally filtered by club_id)
 */
export async function getAchievements(clubId?: string): Promise<Achievement[]> {
  let endpoint = API_ENDPOINTS.ACHIEVEMENTS;
  if (clubId) {
    endpoint += `?club_id=${clubId}`;
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
 * Add achievement
 */
export async function addAchievement(data: CreateAchievementData): Promise<Achievement> {
  return apiPost<Achievement>(API_ENDPOINTS.ACHIEVEMENTS, data);
}

/**
 * Update achievement
 */
export async function updateAchievement(id: string, data: Partial<CreateAchievementData>): Promise<Achievement> {
  return apiPut<Achievement>(API_ENDPOINTS.ACHIEVEMENT_DETAIL(id), data);
}

/**
 * Delete achievement
 */
export async function deleteAchievement(id: string): Promise<void> {
  return apiDelete(API_ENDPOINTS.ACHIEVEMENT_DETAIL(id));
}

// ==================== Club Applications ====================

export interface ClubApplication {
  id: string;
  club_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClubApplicationData {
  club_id: string;
  message?: string;
}

/**
 * Get club applications (for the current user or all if admin)
 */
export async function getClubApplications(): Promise<ClubApplication[]> {
  return apiGet<ClubApplication[]>(API_ENDPOINTS.CLUB_APPLICATIONS);
}

/**
 * Submit club application
 */
export async function submitClubApplication(data: CreateClubApplicationData): Promise<ClubApplication> {
  return apiPost<ClubApplication>(API_ENDPOINTS.CLUB_APPLICATIONS, data);
}

/**
 * Update club application status
 */
export async function updateClubApplication(id: string, status: 'approved' | 'rejected'): Promise<ClubApplication> {
  return apiPut<ClubApplication>(API_ENDPOINTS.CLUB_APPLICATION_DETAIL(id), { status });
}
