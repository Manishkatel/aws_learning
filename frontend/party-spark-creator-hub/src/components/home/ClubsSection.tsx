import { useState, useEffect } from "react";
import { Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getClubs } from "@/services/django-clubs";
import { DJANGO_API_URL } from "@/services/django-api";
import { useToast } from "@/hooks/use-toast";

interface Club {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  owner_id: string;
  created_at: string;
  category: string;
  members: number;
  upcomingEvents: number;
}

// Mock featured clubs data as fallback
const featuredClubs = [
  {
    id: "1",
    name: "Computer Science Club",
    description: "Building the future through code. Weekly hackathons, tech talks, and career prep.",
    members: 284,
    category: "Technology",
    upcomingEvents: 3,
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    owner_id: "",
    created_at: ""
  },
  {
    id: "2",
    name: "Photography Society", 
    description: "Capture moments that matter. Photo walks, workshops, and exhibitions.",
    members: 156,
    category: "Arts",
    upcomingEvents: 2,
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    owner_id: "",
    created_at: ""
  },
  {
    id: "3",
    name: "Debate Team",
    description: "Sharpen your argumentation skills. Compete in tournaments and improve public speaking.",
    members: 89,
    category: "Academic",
    upcomingEvents: 4,
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    owner_id: "",
    created_at: ""
  },
  {
    id: "4",
    name: "Hiking Club",
    description: "Explore the great outdoors. Weekend trips, nature photography, and outdoor adventures.",
    members: 203,
    category: "Outdoor",
    upcomingEvents: 1,
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    owner_id: "",
    created_at: ""
  }
];

const ClubsSection = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const clubsData = await getClubs();
      
      const transformedClubs: Club[] = clubsData.slice(0, 4).map(club => ({
        id: club.id,
        name: club.name,
        description: club.description || '',
        logo_url: getLogoUrl(club.logo_url || club.logo),
        contact_email: club.contact_email,
        contact_phone: club.contact_phone || '',
        website: club.website || '',
        owner_id: club.owner_id,
        created_at: club.created_at,
        category: club.club_type === 'other' ? (club.custom_type || 'Other') : club.club_type,
        members: 0, // TODO: Get from API if available
        upcomingEvents: 0 // TODO: Get from API if available
      }));
      
      setClubs(transformedClubs);
    } catch (error) {
      console.error('Error:', error);
      setClubs(featuredClubs.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  const getLogoUrl = (logo?: string) => {
    if (!logo) return '';
    return logo.startsWith('http') ? logo : `${DJANGO_API_URL}${logo}`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Arts': 'bg-purple-100 text-purple-800', 
      'Academic': 'bg-green-100 text-green-800',
      'Outdoor': 'bg-orange-100 text-orange-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading clubs...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Popular Clubs</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Join communities that match your interests and make lasting connections
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {clubs.map((club) => (
            <Card key={club.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {club.logo_url ? (
                      <img 
                        src={club.logo_url} 
                        alt={club.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <Badge className={getCategoryColor(club.category)} variant="secondary">
                    {club.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{club.name}</CardTitle>
                <CardDescription className="text-sm">
                  {club.members} members
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <p className="text-muted-foreground mb-4 text-sm line-clamp-3 flex-grow">
                  {club.description || "No description available"}
                </p>

                <div className="flex gap-2 mt-auto">
                  <Link to={`/club/${club.id}`} onClick={(e) => {
                    if (!club.id) {
                      e.preventDefault();
                      console.error('Club ID is missing:', club);
                    }
                  }}>
                    <Button variant="outline" size="sm">
                      View Club
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      toast({
                        title: "Club Joined!",
                        description: `You've joined "${club.name}"`,
                      });
                    }}
                  >
                    Join Club
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/clubs">
            <Button size="lg" variant="outline">
              Browse All Clubs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ClubsSection;
