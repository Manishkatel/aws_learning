import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Calendar, Building, User, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, getCurrentUser, getUserProfile, logoutUser } from "@/services/django-auth";
import { getMyClubs, deleteClub } from "@/services/django-clubs";
import { getMyEvents, deleteEvent } from "@/services/django-events";
import { apiPatch, API_ENDPOINTS } from "@/services/django-api";

const ClubUserProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ full_name: "", email: "" });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

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
      
      // All authenticated users can access their profile
      
      setUser(currentUser);
      setProfile(profileData);
      setEditedProfile({
        full_name: profileData.full_name || "",
        email: profileData.email || ""
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
      // Fetch user's clubs
      const userClubs = await getMyClubs();
      setClubs(userClubs || []);
      
      // Fetch all events created by user
      const events = await getMyEvents();
      setAllEvents(events || []);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await apiPatch(API_ENDPOINTS.UPDATE_PROFILE, {
        full_name: editedProfile.full_name,
        email: editedProfile.email
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

  const handleCreateEvent = () => {
    navigate('/create');
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
        {/* Header with Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Club Profile</h1>
            <p className="text-muted-foreground">Manage your profile, clubs and events</p>
          </div>
          <div className="flex gap-3">
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

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="clubs">My Clubs</TabsTrigger>
            <TabsTrigger value="events">My Events</TabsTrigger>
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
                  Update your club account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-sm text-muted-foreground">{profile?.full_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Statistics</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">{clubs.length}</div>
                          <div className="text-sm text-muted-foreground">Clubs Created</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">{allEvents.length}</div>
                          <div className="text-sm text-muted-foreground">Events Created</div>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => setEditMode(true)} className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
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

          {/* My Clubs Tab */}
          <TabsContent value="clubs" className="space-y-6">
            <div className="flex items-center justify-between">
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
                          <Eye className="h-4 w-4" />
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
          </TabsContent>

          {/* My Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
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
                          {(event as any).clubs?.name} • {new Date(event.event_date).toLocaleDateString()}
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ClubUserProfile;