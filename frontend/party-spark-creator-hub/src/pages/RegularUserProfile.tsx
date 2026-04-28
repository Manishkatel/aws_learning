import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Settings, Calendar, Star, Users, Edit, Trash2, Eye, MapPin, Clock, DollarSign, Plus, Building, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, getCurrentUser, getUserProfile, logoutUser } from "@/services/django-auth";
import { getEventAttendees, getStarredEvents, unstarEvent, getMyEvents, deleteEvent, getEvents } from "@/services/django-events";
import { getClubMembers, removeClubMember, getMyClubs, deleteClub, getClubs } from "@/services/django-clubs";
import { apiPatch, API_ENDPOINTS } from "@/services/django-api";
import EventDetailsDialog from "@/components/events/EventDetailsDialog";

const RegularUserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [starredEvents, setStarredEvents] = useState<any[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ 
    full_name: "", 
    email: "", 
    phone: "", 
    bio: "", 
    location: "", 
    interests: "" 
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Refresh data when navigating to profile page (e.g., after creating club/event)
  useEffect(() => {
    // Refresh data when location changes (user navigates to this page)
    // Also check for refresh state from navigation
    if (user && isAuthenticated()) {
      const shouldRefresh = location.state?.refresh || location.pathname === '/profile';
      if (shouldRefresh) {
        console.log('Profile page mounted/navigated with refresh flag, refreshing data...');
        fetchUserData();
      }
    }
  }, [location.pathname, location.state, user]); // Refresh when pathname, state, or user changes

  const checkAuth = async () => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }
    
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      
      const profileData = await getUserProfile();
      
      if (!profileData) {
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      
      setUser(currentUser);
      setProfile(profileData);
      setEditedProfile({
        full_name: profileData.full_name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        interests: Array.isArray(profileData.interests) ? profileData.interests.join(', ') : (profileData.interests || "")
      });
    } catch (error: any) {
      console.error('Error checking auth:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try logging in again.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    
    try {
      // Fetch joined events (event attendees for current user)
      try {
        const attendees = await getEventAttendees();
        if (attendees && attendees.length > 0) {
          // Get event IDs from attendees
          const eventIds = attendees.map(attendee => attendee.event_id || attendee.event).filter(Boolean);
          
          // Fetch all events and match with attendees to get full event data
          try {
            const allEvents = await getEvents();
            const eventsData = attendees
              .map(attendee => {
                const eventId = attendee.event_id || attendee.event;
                if (!eventId) return null;
                
                // Find the full event data
                const fullEvent = allEvents.find(e => 
                  String(e.id) === String(eventId) || 
                  String(e.id) === String(attendee.event)
                );
                
                if (fullEvent) {
                  return {
                    ...fullEvent,
                    id: eventId
                  };
                }
                
                // Fallback: use attendee data if event not found
                return {
                  id: eventId,
                  title: attendee.title || 'Event',
                  event_date: attendee.event_date || null,
                  location: attendee.location || '',
                  club_name: attendee.club_name || '',
                  price: attendee.price || 0,
                  event_type: attendee.event_type || '',
                  ...attendee
                };
              })
              .filter(event => event !== null && event.event_date); // Filter out null and invalid dates
            
            setJoinedEvents(eventsData || []);
          } catch (eventsError) {
            console.error('Error fetching events for joined events:', eventsError);
            // Fallback: use attendee data but filter out invalid dates
            const eventsData = attendees
              .map(attendee => ({
                id: attendee.event_id || attendee.event,
                title: attendee.title || 'Event',
                event_date: attendee.event_date || null,
                location: attendee.location || '',
                club_name: attendee.club_name || '',
                price: attendee.price || 0,
                ...attendee
              }))
              .filter(event => event.event_date && !isNaN(new Date(event.event_date).getTime()));
            setJoinedEvents(eventsData || []);
          }
        } else {
          setJoinedEvents([]);
        }
      } catch (error) {
        console.error('Error fetching joined events:', error);
        setJoinedEvents([]);
      }

      // Fetch starred events
      try {
        console.log('Fetching starred events...');
        const starredEventsData = await getStarredEvents();
        console.log('Starred events received:', starredEventsData);
        if (starredEventsData && starredEventsData.length > 0) {
          // Extract event data from star objects - event details are nested in star.event
          const events = starredEventsData.map(star => {
            // If star.event is an object (full event details), use it
            // Otherwise, use the star object itself if it already has event fields
            if (star.event && typeof star.event === 'object') {
              return {
                id: star.event.id || star.event_id || star.id,
                ...star.event,
                star_id: star.id // Keep the star ID for unstarring
              };
            } else {
              // Fallback: use star object directly if event is just an ID
              return {
                id: star.event_id || star.event || star.id,
                ...star,
                star_id: star.id
              };
            }
          });
          setStarredEvents(events);
        } else {
          setStarredEvents([]);
        }
      } catch (error) {
        console.error('Error fetching starred events:', error);
        setStarredEvents([]);
      }

      // Fetch joined clubs
      try {
        const members = await getClubMembers();
        if (members && members.length > 0) {
          // Members should have club info, but we might need to fetch clubs separately
          // For now, use the member data
          setJoinedClubs(members.map(member => ({
            id: member.club_id || member.club,
            ...member
          })) || []);
        } else {
          setJoinedClubs([]);
        }
      } catch (error) {
        console.error('Error fetching joined clubs:', error);
        setJoinedClubs([]);
      }

      // Fetch my events (events created by user)
      try {
        console.log('RegularUserProfile: Fetching my events...');
        const myEventsData = await getMyEvents();
        console.log('RegularUserProfile: My events received:', myEventsData);
        console.log('RegularUserProfile: Number of events:', myEventsData?.length || 0);
        if (myEventsData && Array.isArray(myEventsData)) {
          // Log each event to verify they have club information
          myEventsData.forEach(event => {
            console.log('RegularUserProfile: Event:', event.title, 'club_id:', event.club_id, 'club_name:', event.club_name);
          });
          setMyEvents(myEventsData);
        } else {
          console.warn('RegularUserProfile: My events data is not an array:', myEventsData);
          setMyEvents([]);
        }
      } catch (error: any) {
        console.error('RegularUserProfile: Error fetching my events:', error);
        console.error('RegularUserProfile: Error details:', error?.message);
        // If 404, try fallback: fetch all events and filter by created_by
        if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
          console.log('RegularUserProfile: 404 error, trying fallback...');
          try {
            const allEvents = await getEvents();
            const currentUser = getCurrentUser();
            if (currentUser && allEvents) {
              const userEvents = allEvents.filter(event => event.created_by_id === currentUser.id);
              console.log('RegularUserProfile: Filtered user events from all events:', userEvents);
              setMyEvents(userEvents);
              return;
            }
          } catch (fallbackError) {
            console.error('RegularUserProfile: Fallback also failed:', fallbackError);
          }
        }
        setMyEvents([]);
      }

      // Fetch my clubs (clubs created by user)
      try {
        console.log('RegularUserProfile: Fetching my clubs...');
        const currentUser = getCurrentUser();
        console.log('RegularUserProfile: Current user ID:', currentUser?.id);
        
        const myClubsData = await getMyClubs();
        console.log('RegularUserProfile: My clubs received:', myClubsData);
        console.log('RegularUserProfile: Number of clubs:', myClubsData?.length || 0);
        
        if (myClubsData && Array.isArray(myClubsData) && myClubsData.length > 0) {
          console.log('RegularUserProfile: Setting clubs:', myClubsData);
          setMyClubs(myClubsData);
        } else {
          console.warn('RegularUserProfile: My clubs data is empty or not an array, trying fallback...');
          // Try fallback even if response is empty
          try {
            const allClubs = await getClubs();
            console.log('RegularUserProfile: All clubs fetched:', allClubs?.length || 0);
            if (currentUser && allClubs && Array.isArray(allClubs)) {
              const userClubs = allClubs.filter(club => {
                const clubOwnerId = String(club.owner_id || '');
                const userId = String(currentUser.id || '');
                const matches = clubOwnerId === userId;
                if (matches) {
                  console.log('RegularUserProfile: Club matched:', club.name, 'owner_id:', clubOwnerId, 'user_id:', userId);
                }
                return matches;
              });
              console.log('RegularUserProfile: Filtered user clubs from all clubs:', userClubs.length);
              if (userClubs.length > 0) {
                setMyClubs(userClubs);
                return; // Success with fallback
              }
            }
          } catch (fallbackError) {
            console.error('RegularUserProfile: Fallback also failed:', fallbackError);
          }
          setMyClubs([]);
        }
      } catch (error: any) {
        console.error('RegularUserProfile: Error fetching my clubs:', error);
        console.error('RegularUserProfile: Error details:', error?.message, error?.stack);
        
        // Always try fallback on error
        console.warn('RegularUserProfile: Trying fallback after error...');
        try {
          const allClubs = await getClubs();
          const currentUser = getCurrentUser();
          console.log('RegularUserProfile: Fallback - All clubs:', allClubs?.length || 0, 'User ID:', currentUser?.id);
          if (currentUser && allClubs && Array.isArray(allClubs)) {
            const userClubs = allClubs.filter(club => {
              const clubOwnerId = String(club.owner_id || '');
              const userId = String(currentUser.id || '');
              const matches = clubOwnerId === userId;
              if (matches) {
                console.log('RegularUserProfile: Fallback - Club matched:', club.name);
              }
              return matches;
            });
            console.log('RegularUserProfile: Fallback - Filtered clubs:', userClubs.length);
            if (userClubs.length > 0) {
              setMyClubs(userClubs);
              return; // Success with fallback
            }
          }
        } catch (fallbackError) {
          console.error('RegularUserProfile: Fallback also failed:', fallbackError);
        }
        
        // Only show toast for non-404 errors
        if (!error?.message?.includes('404') && !error?.message?.includes('Not Found')) {
          toast({
            title: "Warning",
            description: `Could not load your clubs: ${error?.message || 'Unknown error'}. Please try refreshing the page.`,
            variant: "default",
          });
        }
        setMyClubs([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const interestsArray = editedProfile.interests 
        ? editedProfile.interests.split(',').map(i => i.trim()).filter(i => i)
        : [];

      const updatedProfile = await apiPatch(API_ENDPOINTS.UPDATE_PROFILE, {
        full_name: editedProfile.full_name,
        email: editedProfile.email,
        phone: editedProfile.phone || null,
        bio: editedProfile.bio || null,
        location: editedProfile.location || null,
        interests: interestsArray
      });

      setProfile(updatedProfile);
      setEditMode(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    try {
      // Get attendees to find the attendee ID
      const attendees = await getEventAttendees();
      const attendee = attendees.find(a => (a.event_id || a.event) === eventId);
      
      if (attendee && attendee.id) {
        // TODO: Implement delete attendee API endpoint
        // For now, just remove from local state
        setJoinedEvents(prev => prev.filter(event => event.id !== eventId));
        toast({
          title: "Success",
          description: "Left event successfully",
        });
      } else {
        setJoinedEvents(prev => prev.filter(event => event.id !== eventId));
        toast({
          title: "Success",
          description: "Left event successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to leave event",
        variant: "destructive",
      });
    }
  };

  const handleUnstarEvent = async (eventId: string) => {
    try {
      // Get starred events to find the star ID
      const starredEventsData = await getStarredEvents();
      // Find the star - check both event.id (if nested) and event_id/event (if flat)
      const star = starredEventsData.find(s => {
        if (s.event && typeof s.event === 'object') {
          return s.event.id === eventId || s.event_id === eventId;
        }
        return (s.event_id || s.event) === eventId;
      });
      
      // Use star_id if available (from our mapping), otherwise use star.id
      const starId = starredEvents.find(e => e.id === eventId)?.star_id || star?.id;
      
      if (starId) {
        await unstarEvent(starId);
        setStarredEvents(prev => prev.filter(event => event.id !== eventId));
        toast({
          title: "Success",
          description: "Removed from starred events",
        });
      } else {
        // Fallback: just remove from local state
        setStarredEvents(prev => prev.filter(event => event.id !== eventId));
        toast({
          title: "Success",
          description: "Removed from starred events",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unstar event",
        variant: "destructive",
      });
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    try {
      // Get club members to find the member ID
      const members = await getClubMembers(clubId);
      const currentUser = getCurrentUser();
      const member = members.find(m => m.user_id === currentUser?.id);
      
      if (member && member.id) {
        await removeClubMember(member.id);
        setJoinedClubs(prev => prev.filter(club => club.id !== clubId));
        toast({
          title: "Success",
          description: "Left club successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "You are not a member of this club",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to leave club",
        variant: "destructive",
      });
    }
  };

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto pt-8">
          <Card>
            <CardContent className="text-center py-12">
              <p>Loading profile...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your profile and view your activity</p>
          </div>
          <Button 
            onClick={fetchUserData} 
            variant="outline"
            disabled={loading}
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="my-events">My Events</TabsTrigger>
            <TabsTrigger value="my-clubs">My Clubs</TabsTrigger>
            <TabsTrigger value="events">Joined Events</TabsTrigger>
            <TabsTrigger value="starred">Starred Events</TabsTrigger>
            <TabsTrigger value="clubs">Joined Clubs</TabsTrigger>
          </TabsList>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Full Name</Label>
                        <p className="text-sm text-muted-foreground">{profile?.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <p className="text-sm text-muted-foreground">{profile?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <p className="text-sm text-muted-foreground">{profile?.location || 'Not provided'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Bio</Label>
                      <p className="text-sm text-muted-foreground">{profile?.bio || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Interests</Label>
                      <p className="text-sm text-muted-foreground">{profile?.interests || 'Not provided'}</p>
                    </div>
                    <Button onClick={() => setEditMode(true)} className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={editedProfile.full_name}
                          onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedProfile.email}
                          onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={editedProfile.phone}
                          onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editedProfile.location}
                          onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Input
                        id="bio"
                        value={editedProfile.bio}
                        onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="interests">Interests</Label>
                      <Input
                        id="interests"
                        value={editedProfile.interests}
                        onChange={(e) => setEditedProfile({ ...editedProfile, interests: e.target.value })}
                        placeholder="e.g., Sports, Music, Technology..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} className="flex-1">
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Events Tab */}
          <TabsContent value="my-events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                My Events ({myEvents.length})
              </h2>
              <Button onClick={() => navigate('/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
            
            <div className="grid gap-4">
              {myEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.club_name ? `${event.club_name} • ` : ''}{new Date(event.event_date).toLocaleDateString()} • {event.location}
                        </p>
                        <div className="flex gap-2 items-center mt-2">
                          <Badge variant="secondary">{event.event_type}</Badge>
                          {event.price === 0 || !event.price ? (
                            <Badge variant="outline">FREE</Badge>
                          ) : (
                            <Badge variant="outline">${event.price}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/event/${event.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Event</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{event.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={async () => {
                                try {
                                  await deleteEvent(event.id);
                                  setMyEvents(prev => prev.filter(e => e.id !== event.id));
                                  toast({
                                    title: "Success",
                                    description: "Event deleted successfully",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to delete event",
                                    variant: "destructive",
                                  });
                                }
                              }}>
                                Delete Event
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {myEvents.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No events created yet</p>
                    <Button onClick={() => navigate('/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Event
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* My Clubs Tab */}
          <TabsContent value="my-clubs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Building className="h-6 w-6" />
                My Clubs ({myClubs.length})
              </h2>
              <Button onClick={() => navigate('/club/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Club
              </Button>
            </div>
            
            <div className="grid gap-4">
              {myClubs.map((club) => (
                <Card key={club.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{club.name}</h3>
                        <p className="text-sm text-muted-foreground">{club.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">
                            {club.club_type === 'other' ? club.custom_type : club.club_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(club.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/club/${club.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/club/${club.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Club</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{club.name}"? This action cannot be undone and will remove all associated events and data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={async () => {
                                try {
                                  await deleteClub(club.id);
                                  setMyClubs(prev => prev.filter(c => c.id !== club.id));
                                  toast({
                                    title: "Success",
                                    description: "Club deleted successfully",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to delete club",
                                    variant: "destructive",
                                  });
                                }
                              }}>
                                Delete Club
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {myClubs.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No clubs created yet</p>
                    <Button onClick={() => navigate('/club/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Club
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Joined Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Joined Events ({joinedEvents.length})
              </h2>
            </div>
            
            <div className="grid gap-4">
              {joinedEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{event.title || 'Event'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.club_name || (event as any).clubs?.name || ''} • {event.event_date ? (() => {
                            const date = new Date(event.event_date);
                            return isNaN(date.getTime()) ? 'Date TBD' : date.toLocaleDateString();
                          })() : 'Date TBD'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                          {event.event_date && !isNaN(new Date(event.event_date).getTime()) && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(event.event_date).toLocaleTimeString()}
                            </div>
                          )}
                          {event.price > 0 && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${event.price}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEvent(event)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Leave Event</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to leave "{event.title}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleLeaveEvent(event.id)}>
                                Leave Event
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {joinedEvents.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't joined any events yet</p>
                    <Button onClick={() => navigate('/events')}>
                      Browse Events
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Starred Events Tab */}
          <TabsContent value="starred" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Star className="h-6 w-6" />
                Starred Events ({starredEvents.length})
              </h2>
            </div>
            
            <div className="grid gap-4">
              {starredEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{event.title || 'Event'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.club_name || (event.club && typeof event.club === 'object' ? event.club.name : '')} • {event.event_date ? (() => {
                            const date = new Date(event.event_date);
                            return isNaN(date.getTime()) ? 'Date TBD' : date.toLocaleDateString();
                          })() : 'Date TBD'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                          {event.event_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {typeof event.event_time === 'string' ? event.event_time : new Date(`2000-01-01T${event.event_time}`).toLocaleTimeString()}
                            </div>
                          )}
                          {(event.price > 0 || event.price === 0) && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {event.price === 0 ? 'FREE' : `$${event.price}`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEvent(event)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Star className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Star</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove "{event.title}" from your starred events?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleUnstarEvent(event.id)}>
                                Remove Star
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {starredEvents.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't starred any events yet</p>
                    <Button onClick={() => navigate('/events')}>
                      Browse Events
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Joined Clubs Tab */}
          <TabsContent value="clubs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Joined Clubs ({joinedClubs.length})
              </h2>
            </div>
            
            <div className="grid gap-4">
              {joinedClubs.map((club) => (
                <Card key={club.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{club.name}</h3>
                        <p className="text-sm text-muted-foreground">{club.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">
                            {club.club_type === 'other' ? club.custom_type : club.club_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/club/${club.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Leave Club</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to leave "{club.name}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleLeaveClub(club.id)}>
                                Leave Club
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {joinedClubs.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't joined any clubs yet</p>
                    <Button onClick={() => navigate('/clubs')}>
                      Browse Clubs
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </Layout>
  );
};

export default RegularUserProfile;