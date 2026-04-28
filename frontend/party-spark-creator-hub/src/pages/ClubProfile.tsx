import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, MapPin, Globe, Mail, Phone, Clock, Bell, Edit, Trash2 } from "lucide-react";
import ClubApplicationForm from "@/components/clubs/ClubApplicationForm";
import EventReminderDialog from "@/components/clubs/EventReminderDialog";
import { useToast } from "@/hooks/use-toast";
import { getClub, deleteClub, getBoardMembers, getAchievements, addClubMember, removeClubMember, getClubMembers } from "@/services/django-clubs";
import { getEvents } from "@/services/django-events";
import { isAuthenticated, getCurrentUser } from "@/services/django-auth";
import { DJANGO_API_URL } from "@/services/django-api";

interface ClubMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  joinDate: string;
}

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attendees: number;
}

interface Club {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  category: string;
  totalMembers: number;
  objective: string;
  achievements: string[];
  topMembers: ClubMember[];
  upcomingEvents: ClubEvent[];
  pastEvents: ClubEvent[];
}

const ClubProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [club, setClub] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (id) {
      checkAuth();
      fetchClubData();
    }
  }, [id]);

  const checkAuth = async () => {
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      
      // Check if user has already joined this club
      if (currentUser && id) {
        try {
          const members = await getClubMembers(id);
          const isMember = members.some(member => member.user_id === currentUser.id);
          setHasJoined(isMember);
        } catch (error) {
          console.error('Error checking club membership:', error);
        }
      }
    }
  };

  const fetchClubData = async () => {
    try {
      if (!id) {
        toast({
          title: "Error",
          description: "Club ID is missing",
          variant: "destructive",
        });
        navigate('/clubs');
        return;
      }

      setLoading(true);
      
      // Fetch club details
      const clubData = await getClub(id);
      
      if (!clubData) {
        throw new Error('Club not found');
      }
      
      // Transform logo URL if it exists
      if (clubData.logo_url) {
        clubData.logo_url = clubData.logo_url.startsWith('http') 
          ? clubData.logo_url 
          : `${DJANGO_API_URL}${clubData.logo_url}`;
      } else if (clubData.logo) {
        clubData.logo = clubData.logo.startsWith('http')
          ? clubData.logo
          : `${DJANGO_API_URL}${clubData.logo}`;
      }

      setClub(clubData);
      
      const currentUser = getCurrentUser();
      setIsOwner(currentUser?.id === clubData.owner_id);

      // Fetch related data in parallel - don't fail if some fail
      try {
        const allEvents = await getEvents().catch(() => []);
        const boardMembersResult = await getBoardMembers(id).catch(() => []);
        const achievementsResult = await getAchievements(id).catch(() => []);

        // Filter events by club_id - handle both paginated and non-paginated responses
        const eventsArray = Array.isArray(allEvents) ? allEvents : [];
        console.log('ClubProfile: All events fetched:', eventsArray.length);
        console.log('ClubProfile: Club ID:', id, 'Club data ID:', clubData.id);
        
        const clubEvents = eventsArray.filter(event => {
          const eventClubId = event.club_id || event.club?.id || event.club;
          // Convert both to strings for comparison (handles UUID vs string)
          const matches = String(eventClubId) === String(id) || String(eventClubId) === String(clubData.id);
          if (matches) {
            console.log('ClubProfile: Event matched:', event.title, 'club_id:', eventClubId);
          }
          return matches;
        });
        
        console.log('ClubProfile: Filtered club events:', clubEvents.length);
        setEvents(clubEvents);
        setBoardMembers(Array.isArray(boardMembersResult) ? boardMembersResult : []);
        setAchievements(Array.isArray(achievementsResult) ? achievementsResult : []);
      } catch (error) {
        console.error('Error fetching related data:', error);
        // Don't fail the whole page if related data fails
        setEvents([]);
        setBoardMembers([]);
        setAchievements([]);
      }

    } catch (error: any) {
      console.error('Error loading club:', error);
      const errorMessage = error?.message || 'Unknown error';
      
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast({
          title: "Club Not Found",
          description: "The club you're looking for doesn't exist",
          variant: "destructive",
        });
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        toast({
          title: "Connection Error",
          description: "Could not connect to the server. Please check if the backend is running.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage || "Failed to load club data",
          variant: "destructive",
        });
      }
      
      // Redirect back to clubs list after a delay
      setTimeout(() => {
        navigate('/clubs');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClub = () => {
    navigate(`/club/${id}/edit`);
  };

  const handleDeleteClub = async () => {
    try {
      if (!id) return;
      await deleteClub(id);

      toast({
        title: "Success",
        description: "Club deleted successfully",
      });
      navigate('/clubs');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete club",
        variant: "destructive",
      });
    }
  };

  const handleJoinClub = async () => {
    if (!isAuthenticated()) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to join a club",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!id) return;

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      await addClubMember({
        user_id: currentUser.id,
        club_id: id
      });

      setHasJoined(true);
      toast({
        title: "Success",
        description: `You've joined ${club?.name || 'the club'}!`,
      });
    } catch (error: any) {
      if (error.message?.includes('already') || error.message?.includes('unique')) {
        toast({
          title: "Already Joined",
          description: "You've already joined this club",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to join club",
          variant: "destructive",
        });
      }
    }
  };

  const handleLeaveClub = async () => {
    try {
      if (!id) return;

      const currentUser = getCurrentUser();
      if (!currentUser) return;

      // Get club members to find the member ID
      const members = await getClubMembers(id);
      const member = members.find(m => m.user_id === currentUser.id);
      
      if (member) {
        await removeClubMember(member.id);
        setHasJoined(false);
        toast({
          title: "Left Club",
          description: `You've left ${club?.name || 'the club'}`,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSetReminder = (event: ClubEvent) => {
    setSelectedEvent(event);
    setShowReminderDialog(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Fetching club information</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!club) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Club Not Found</h2>
            <p className="text-muted-foreground">The club you're looking for doesn't exist</p>
            <Button onClick={() => navigate('/clubs')} className="mt-4">
              Back to Clubs
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Club Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={club.logo || club.logo_url} alt={club.name} />
                <AvatarFallback className="text-2xl">{club.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-3xl font-bold">{club.name}</h1>
                  <Badge variant="secondary" className="w-fit">
                    {club.club_type === 'other' ? club.custom_type : club.club_type}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">{club.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{boardMembers.length} board members</span>
                  </div>
                  {club.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a href={club.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        Website
                      </a>
                    </div>
                  )}
                  {club.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{club.contact_email}</span>
                    </div>
                  )}
                  {club.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{club.contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isOwner ? (
                  <>
                    <Button onClick={handleEditClub} variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Club
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Club
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Club</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{club.name}"? This action cannot be undone and will remove all associated events, members, and data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteClub}>
                            Delete Club
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <>
                    {!hasJoined ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="bg-primary hover:bg-primary/90">
                            Join Club
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Join Club</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to join "{club.name}"? You'll become a member and receive updates about club activities.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleJoinClub}>
                              Join Club
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline">
                            Leave Club
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Leave Club</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to leave "{club.name}"? You'll no longer be a member and won't receive club updates.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLeaveClub}>
                              Leave Club
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs Content */}
        <Tabs defaultValue="information" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="information">
            <Card>
              <CardHeader>
                <CardTitle>About Our Club</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About Our Club</h3>
                    <p className="text-muted-foreground">{club.description}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      {club.contact_email && (
                        <p className="text-muted-foreground">Email: {club.contact_email}</p>
                      )}
                      {club.contact_phone && (
                        <p className="text-muted-foreground">Phone: {club.contact_phone}</p>
                      )}
                      {club.website && (
                        <p className="text-muted-foreground">
                          Website: <a href={club.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{club.website}</a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Leadership Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {boardMembers.map((member) => (
                      <div key={member.id} className="text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-3">
                          <AvatarImage src={member.photo_url} alt={member.name} />
                          <AvatarFallback>{member.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.position || 'Member'}</p>
                        {member.year_in_college && (
                          <p className="text-xs text-muted-foreground">{member.year_in_college}</p>
                        )}
                        {member.joined_date && (
                          <p className="text-xs text-muted-foreground">Joined {formatDate(member.joined_date)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {boardMembers.length === 0 && (
                    <p className="text-center text-muted-foreground">No board members listed yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.filter(event => {
                      const eventDate = new Date(event.event_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Reset time to compare dates only
                      return eventDate >= today;
                    }).map((event) => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetReminder(event)}
                            className="ml-4"
                          >
                            <Bell className="h-4 w-4 mr-1" />
                            Remind Me
                          </Button>
                        </div>
                        <p className="text-muted-foreground mb-3">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.event_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {events.filter(event => {
                      const eventDate = new Date(event.event_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return eventDate >= today;
                    }).length === 0 && (
                      <p className="text-center text-muted-foreground">No upcoming events scheduled.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Our Achievements</CardTitle>
              </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <span className="font-medium">{achievement.title}</span>
                          {achievement.description && (
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          )}
                          {achievement.date_achieved && (
                            <p className="text-xs text-muted-foreground">{formatDate(achievement.date_achieved)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {achievements.length === 0 && (
                      <p className="text-center text-muted-foreground">No achievements recorded yet.</p>
                    )}
                  </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Application Form Dialog */}
        <ClubApplicationForm
          club={club}
          isOpen={showApplicationForm}
          onClose={() => setShowApplicationForm(false)}
        />

        {/* Event Reminder Dialog */}
        <EventReminderDialog
          event={selectedEvent}
          isOpen={showReminderDialog}
          onClose={() => setShowReminderDialog(false)}
        />
      </div>
    </Layout>
  );
};

export default ClubProfile;