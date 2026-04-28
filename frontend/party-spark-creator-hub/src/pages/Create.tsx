
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EventForm from "@/components/events/EventForm";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, getCurrentUser, getUserProfile } from "@/services/django-auth";
import { getMyClubs, getClubs } from "@/services/django-clubs";

const Create = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Get pre-selected club from navigation state
  const selectedClubId = location.state?.selectedClubId;

  useEffect(() => {
    console.log('Create page mounted, pathname:', location.pathname);
    checkAuthAndFetchClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthAndFetchClubs = async () => {
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
      
      const profile = await getUserProfile();
      setUser({ ...currentUser, ...profile });

      // Fetch user's clubs
      try {
        console.log('Create page: Fetching user clubs...');
        const clubsData = await getMyClubs();
        console.log('Create page: Clubs received:', clubsData);
        if (clubsData && Array.isArray(clubsData) && clubsData.length > 0) {
          setClubs(clubsData);
        } else {
          console.warn('Create page: No clubs from my-clubs endpoint, trying fallback...');
          // Fallback: fetch all clubs and filter by owner_id
          try {
            const allClubs = await getClubs();
            const currentUser = getCurrentUser();
            if (currentUser && allClubs) {
              const userClubs = allClubs.filter(club => club.owner_id === currentUser.id);
              console.log('Create page: Filtered user clubs from all clubs:', userClubs);
              if (userClubs.length > 0) {
                setClubs(userClubs);
                return; // Success with fallback
              }
            }
          } catch (fallbackError) {
            console.error('Create page: Fallback also failed:', fallbackError);
          }
          setClubs([]);
        }
      } catch (clubsError: any) {
        console.error('Create page: Error fetching clubs:', clubsError);
        
        // If it's a 404, try fallback approach
        if (clubsError?.message?.includes('404') || clubsError?.message?.includes('Not Found')) {
          console.log('Create page: 404 error, trying fallback...');
          try {
            const allClubs = await getClubs();
            const currentUser = getCurrentUser();
            if (currentUser && allClubs) {
              const userClubs = allClubs.filter(club => club.owner_id === currentUser.id);
              console.log('Create page: Filtered user clubs from all clubs (fallback):', userClubs);
              if (userClubs.length > 0) {
                setClubs(userClubs);
                return; // Success with fallback
              }
            }
          } catch (fallbackError) {
            console.error('Create page: Fallback also failed:', fallbackError);
          }
        }
        
        // Only show toast if we couldn't get clubs at all
        setClubs([]);
        // Don't show error toast for 404s since we tried fallback
        if (!clubsError?.message?.includes('404') && !clubsError?.message?.includes('Not Found')) {
          toast({
            title: "Warning",
            description: "Could not load your clubs. You can still create a club first.",
            variant: "default",
          });
        }
      }
    } catch (error: any) {
      console.error('Error in checkAuthAndFetchClubs:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load user data",
        variant: "destructive",
      });
      // Only redirect to auth if it's an auth error
      if (error.message?.includes('authentication') || error.message?.includes('token')) {
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto pt-8">
          <Card>
            <CardContent className="text-center py-12">
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto pt-8">
          <Card>
            <CardContent className="text-center py-12">
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (clubs.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto pt-8">
          <Card>
            <CardHeader>
              <CardTitle>No Clubs Found</CardTitle>
              <CardDescription>
                You need to create a club before you can create events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => navigate('/club/create')} className="w-full">
                Create Your First Club
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pt-8 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Create New Event</h1>
          <p className="text-xl text-muted-foreground">
            Fill out the details for your event below
          </p>
        </div>
        
        <EventForm clubs={clubs} user={user} selectedClubId={selectedClubId} />
      </div>
    </Layout>
  );
};

export default Create;
