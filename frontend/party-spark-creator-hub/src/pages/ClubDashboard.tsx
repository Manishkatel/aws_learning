import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Users, Calendar, Award, Settings, User, FileText, Building, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, getCurrentUser, getUserProfile } from "@/services/django-auth";
import { getMyClubs, deleteClub } from "@/services/django-clubs";
import { getMyEvents, deleteEvent } from "@/services/django-events";

const ClubDashboard = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalClubs: 0,
    totalEvents: 0,
    totalApplications: 0,
    totalMembers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, clubId]); // Refresh when clubId changes too

  // Refresh data when navigating to dashboard (using location key or visibility)
  useEffect(() => {
    // Refresh when component mounts or when user navigates back
    if (user && isAuthenticated()) {
      const handleVisibilityChange = () => {
        if (!document.hidden && user) {
          console.log('Page visible, refreshing dashboard data...');
          fetchUserData();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [user]);

  const checkAuth = async () => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }
    
    try {
      const currentUser = getCurrentUser();
      const profile = await getUserProfile();
      
      // All authenticated users can access the dashboard
      setUser({ ...currentUser, ...profile });
    } catch (error: any) {
      console.error('Error checking auth:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
      navigate('/auth');
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    
    try {
      // Fetch all user's clubs
      console.log('Fetching user clubs...');
      const userClubs = await getMyClubs();
      console.log('Received clubs:', userClubs);
      
      if (!userClubs || userClubs.length === 0) {
        console.log('No clubs found for user');
        setClubs([]);
        setAllEvents([]);
        setLoading(false);
        return;
      }
      
      console.log(`Found ${userClubs.length} clubs`);
      setClubs(userClubs);
      
      // Set selected club based on URL param or default to first club
      const currentClub = clubId 
        ? userClubs.find(club => club.id === clubId) 
        : userClubs[0];
      setSelectedClub(currentClub);
      
      // Fetch all events created by user
      const events = await getMyEvents();
      
      // Transform events to include club name
      const eventsWithClub = events.map(event => ({
        ...event,
        club_name: userClubs.find(c => c.id === event.club)?.name || 'Unknown Club'
      }));
      
      setAllEvents(eventsWithClub || []);
      
      // Calculate overall stats
      setStats({
        totalClubs: userClubs.length,
        totalEvents: events?.length || 0,
        totalApplications: 0, // TODO: Implement if needed
        totalMembers: 0 // TODO: Implement if needed
      });
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClubSelect = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    setSelectedClub(club);
    navigate(`/club/${clubId}/dashboard`, { replace: true });
  };

  const handleCreateEvent = () => {
    if (selectedClub) {
      navigate('/create', { state: { selectedClubId: selectedClub.id } });
    } else {
      navigate('/create');
    }
  };

  const handleEditClub = (clubId: string) => {
    navigate(`/club/${clubId}/edit`);
  };

  const handleDeleteClub = async (clubId: string) => {
    try {
      await deleteClub(clubId);
      toast({
        title: "Success",
        description: "Club deleted successfully",
      });
      fetchUserData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete club",
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/event/${eventId}/edit`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      fetchUserData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto pt-8">
          <Card>
            <CardContent className="text-center py-12">
              <p>Loading dashboard...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="max-w-6xl mx-auto pt-8 pb-16">
        {/* Header with Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Club Dashboard</h1>
            <p className="text-muted-foreground">Manage your clubs and events</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={fetchUserData} 
              variant="outline"
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/club/create')} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Club
            </Button>
            <Button onClick={handleCreateEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        {/* My Clubs Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Building className="h-6 w-6" />
              My Clubs ({clubs.length})
            </h2>
          </div>
          
          <div className="grid gap-4">
            {clubs.map((club) => (
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
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClub(club.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                          >
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
                            <AlertDialogAction onClick={() => handleDeleteClub(club.id)}>
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
            {clubs.length === 0 && (
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
        </div>

        {/* My Events Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              My Events ({allEvents.length})
            </h2>
          </div>
          
          <div className="grid gap-4">
            {allEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(event as any).club_name || 'Unknown Club'} • {new Date(event.event_date).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 items-center mt-2">
                        <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                          {event.status || 'active'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {event.share_count || 0} shares
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEvent(event.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                          >
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
                            <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>
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
            {allEvents.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No events created yet</p>
                  <Button onClick={handleCreateEvent}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClubDashboard;