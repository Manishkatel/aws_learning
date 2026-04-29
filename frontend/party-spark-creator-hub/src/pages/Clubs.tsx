import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Calendar, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getClubs, Club as ClubType, addClubMember } from "@/services/django-clubs";
import { isAuthenticated, getCurrentUser, getUserProfile } from "@/services/django-auth";
import { useNavigate } from "react-router-dom";
import { DJANGO_API_URL } from "@/services/django-api";

interface Club {
  id: string;
  name: string;
  description: string;
  logo?: string;
  logo_url?: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  owner_id: string;
  created_at: string;
  club_type: string;
  custom_type?: string;
  category: string;
  members: number;
  upcomingEvents: number;
}

const Clubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Rating");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchClubs();
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [categoryFilter]);

  const checkAuth = async () => {
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      
      // Fetch user profile
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
  };

  const fetchClubs = async () => {
    try {
      setLoading(true);
      
      const filters: { club_type?: string } = {};
      
      // Map category filter to club_type
      if (categoryFilter !== "All") {
        filters.club_type = categoryFilter.toLowerCase();
      }
      
      const clubsData = await getClubs(filters);
      
      // Handle empty array (no clubs in backend - this is OK, not an error)
      if (!clubsData || clubsData.length === 0) {
        setClubs([]);
        setLoading(false);
        return;
      }
      
      // Transform data to match Club interface
      const transformedClubs: Club[] = clubsData.map(club => ({
        ...club,
        logo: club.logo ? (club.logo.startsWith('http') ? club.logo : `${DJANGO_API_URL}${club.logo}`) : undefined,
        logo_url: club.logo_url ? (club.logo_url.startsWith('http') ? club.logo_url : `${DJANGO_API_URL}${club.logo_url}`) : undefined,
        category: club.club_type === 'other' ? (club.custom_type || 'Other') : club.club_type,
        members: 0, // TODO: Add member count if available from API
        upcomingEvents: 0 // TODO: Add event count if available from API
      }));
      
      setClubs(transformedClubs);
    } catch (error: any) {
      console.error('Error fetching clubs:', error);
      // Only show error toast for actual API errors, not for empty results
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        toast({
          title: "Connection Error",
          description: "Could not connect to the server. Please check if the backend is running.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage || "Failed to load clubs",
          variant: "destructive",
        });
      }
      setClubs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Technical': 'bg-blue-100 text-blue-800',
      'Arts': 'bg-purple-100 text-purple-800',
      'Academic': 'bg-green-100 text-green-800',
      'Outdoor': 'bg-orange-100 text-orange-800',
      'Sports': 'bg-red-100 text-red-800',
      'Cultural': 'bg-pink-100 text-pink-800',
      'Social': 'bg-yellow-100 text-yellow-800',
      'Professional': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredAndSortedClubs = clubs
    .filter(club => {
      if (categoryFilter !== "All" && club.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Members":
          return b.members - a.members;
        case "Events":
          return b.upcomingEvents - a.upcomingEvents;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto pt-8 pb-16">
          <div className="text-center">Loading clubs...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pt-8 pb-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Clubs & Organizations</h1>
            <p className="text-muted-foreground mt-2">
              Discover clubs and organizations creating amazing events
            </p>
          </div>
          {user && (
            <Button onClick={() => navigate("/club/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Club
            </Button>
          )}
          {!user && (
            <Button onClick={() => navigate("/auth")}>
              <Plus className="w-4 h-4 mr-2" />
              Sign In to Create Club
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Arts">Arts</SelectItem>
              <SelectItem value="Academic">Academic</SelectItem>
              <SelectItem value="Sports">Sports</SelectItem>
              <SelectItem value="Cultural">Cultural</SelectItem>
              <SelectItem value="Social">Social</SelectItem>
              <SelectItem value="Professional">Professional</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Members">Sort by Members</SelectItem>
              <SelectItem value="Events">Sort by Events</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAndSortedClubs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Clubs Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create a club and start organizing events!
              </p>
              {user && (
                <Button onClick={() => navigate("/club/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Club
                </Button>
              )}
              {!user && (
                <Button onClick={() => navigate("/auth")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Sign In to Create Club
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedClubs.map((club) => (
              <Card key={club.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {club.logo_url || club.logo ? (
                      <img 
                        src={club.logo_url || club.logo} 
                        alt={club.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{club.name}</CardTitle>
                        <Badge className={getCategoryColor(club.category)} variant="secondary">
                          {club.category}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {club.members} members • Since {new Date(club.created_at).getFullYear()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {club.description || "No description available"}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (club.id) {
                          navigate(`/club/${club.id}`);
                        } else {
                          toast({
                            title: "Error",
                            description: "Club ID is missing",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View Club
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={async () => {
                        if (!isAuthenticated()) {
                          toast({
                            title: "Please log in",
                            description: "You need to be logged in to join clubs",
                            variant: "destructive",
                          });
                          navigate('/auth');
                          return;
                        }

                        try {
                          const currentUser = getCurrentUser();
                          if (!currentUser) return;

                          await addClubMember({
                            user_id: currentUser.id,
                            club_id: club.id
                          });

                          toast({
                            title: "Club Joined!",
                            description: `You've joined "${club.name}"`,
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
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Join Club
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Clubs;
