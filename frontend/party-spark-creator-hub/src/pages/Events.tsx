import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Filter, Eye, Star, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getEvents, registerForEvent, starEvent, Event as EventType } from "@/services/django-events";
import { isAuthenticated } from "@/services/django-auth";
import { useNavigate } from "react-router-dom";
import EventDetailsDialog from "@/components/events/EventDetailsDialog";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  club: string;
  attendees: number;
  price: number;
  category: string;
  additional_info?: string;
}

// Mock events data - in a real app this would come from API
const allMockEvents: Event[] = [
  {
    id: "1",
    title: "Tech Career Fair 2024",
    description: "Meet top tech companies and discover internship opportunities. Network with recruiters from Google, Microsoft, and more.",
    date: "2024-03-15T14:00:00Z",
    location: "Engineering Building, Hall A",
    club: "Computer Science Club",
    attendees: 234,
    price: 0,
    category: "Career"
  },
  {
    id: "2",
    title: "Spring Music Festival",
    description: "Live performances by student bands and local artists. Food trucks, games, and good vibes all day long.",
    date: "2024-03-20T18:00:00Z",
    location: "Campus Quad",
    club: "Music Society",
    attendees: 156,
    price: 15,
    category: "Entertainment"
  },
  {
    id: "3",
    title: "Research Symposium",
    description: "Student research presentations across all disciplines. Showcase your work and learn from peers.",
    date: "2024-03-18T09:00:00Z",
    location: "Academic Center",
    club: "Graduate Student Association",
    attendees: 89,
    price: 0,
    category: "Academic"
  },
  {
    id: "4",
    title: "Sustainability Workshop",
    description: "Learn practical tips for sustainable living on campus. DIY projects and eco-friendly initiatives.",
    date: "2024-03-22T15:30:00Z",
    location: "Environmental Science Building",
    club: "Green Campus Initiative",
    attendees: 67,
    price: 5,
    category: "Workshop"
  },
  {
    id: "5",
    title: "Basketball Tournament",
    description: "Inter-department basketball championship. Cheer for your department and enjoy the competition.",
    date: "2024-03-25T16:00:00Z",
    location: "Sports Complex",
    club: "Athletic Department",
    attendees: 312,
    price: 0,
    category: "Sports"
  },
  {
    id: "6",
    title: "Art Gallery Opening",
    description: "Showcase of student artwork from this semester. Wine, cheese, and creative conversations.",
    date: "2024-03-28T19:00:00Z",
    location: "Arts Building Gallery",
    club: "Art Students Union",
    attendees: 94,
    price: 10,
    category: "Arts"
  }
];

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [priceFilter, setPriceFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Date");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [starredEvents, setStarredEvents] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [categoryFilter, priceFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const filters: {
        event_type?: string;
        is_free?: boolean;
      } = {};
      
      // Map category filter to event_type
      if (categoryFilter !== "All") {
        filters.event_type = categoryFilter.toLowerCase();
      }
      
      // Map price filter
      if (priceFilter === "Free") {
        filters.is_free = true;
      } else if (priceFilter === "Paid") {
        filters.is_free = false;
      }
      
      const eventsData = await getEvents(filters);
      
      // Handle empty array (no events in backend - this is OK, not an error)
      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }
      
      // Transform Django API data to match our Event interface
      const transformedEvents: Event[] = eventsData.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: `${event.event_date}T${event.event_time || '00:00:00'}`,
        location: event.location || '',
        club: event.club_name || 'Unknown Club',
        attendees: 0, // TODO: Get from API if available
        price: Number(event.price) || 0,
        category: event.event_type ? event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1) : 'Other',
        additional_info: ''
      }));
      
      setEvents(transformedEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
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
          description: errorMessage || "Failed to load events",
          variant: "destructive",
        });
      }
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Workshop': 'bg-orange-100 text-orange-800',
      'Seminar': 'bg-blue-100 text-blue-800',
      'Conference': 'bg-purple-100 text-purple-800',
      'Social': 'bg-green-100 text-green-800',
      'Sports': 'bg-red-100 text-red-800',
      'Cultural': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleStarEvent = async (eventId: string) => {
    if (!isAuthenticated()) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to star events",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      const isStarred = starredEvents.has(eventId);
      
      if (isStarred) {
        // Unstar event - would need to get star ID first, for now just update local state
        // TODO: Implement unstar API call when available
        setStarredEvents(prev => {
          const newStarred = new Set(prev);
          newStarred.delete(eventId);
          return newStarred;
        });
        toast({
          title: "Removed from favorites",
          description: "Event removed from your favorites",
        });
      } else {
        // Star event
        await starEvent(eventId);
        setStarredEvents(prev => {
          const newStarred = new Set(prev);
          newStarred.add(eventId);
          return newStarred;
        });
        toast({
          title: "Added to favorites",
          description: "Event added to your favorites",
        });
      }
    } catch (error: any) {
      if (error.message?.includes('already') || error.message?.includes('already starred')) {
        // Already starred, just update local state
        setStarredEvents(prev => {
          const newStarred = new Set(prev);
          newStarred.add(eventId);
          return newStarred;
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to star event",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
    setIsDetailsOpen(false);
  };

  const filteredAndSortedEvents = events
    .filter(event => {
      if (categoryFilter !== "All" && event.category !== categoryFilter) return false;
      if (priceFilter === "Free" && event.price > 0) return false;
      if (priceFilter === "Paid" && event.price === 0) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "Attendees":
          return b.attendees - a.attendees;
        case "Price":
          return a.price - b.price;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto pt-8 pb-16">
          <div className="text-center">Loading events...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pt-8 pb-16">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-4">University Events</h1>
            <p className="text-muted-foreground mb-6">
              Discover and join exciting events happening on campus
            </p>
          </div>
          {isAuthenticated() && (
            <Button 
              onClick={() => navigate('/create')} 
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Event
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
              <SelectItem value="Workshop">Workshop</SelectItem>
              <SelectItem value="Seminar">Seminar</SelectItem>
              <SelectItem value="Conference">Conference</SelectItem>
              <SelectItem value="Social">Social</SelectItem>
              <SelectItem value="Sports">Sports</SelectItem>
              <SelectItem value="Cultural">Cultural</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Prices</SelectItem>
              <SelectItem value="Free">Free</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Date">Sort by Date</SelectItem>
              <SelectItem value="Attendees">Sort by Attendees</SelectItem>
              <SelectItem value="Price">Sort by Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Events List */}
        {filteredAndSortedEvents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
              <p className="text-muted-foreground mb-4">
                {events.length === 0 
                  ? "There are no events in the system yet. Check back later or create an event if you're a club organizer."
                  : "No events match your current filters. Try adjusting your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(event.category)} variant="secondary">
                      {event.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStarEvent(event.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Star 
                        className={`w-4 h-4 ${starredEvents.has(event.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                    </Button>
                  </div>
                  {event.price === 0 ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      FREE
                    </Badge>
                  ) : (
                    <Badge variant="outline">${event.price}</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription className="text-sm">
                  by {event.club}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                  {event.description}
                </p>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    {event.attendees} attending
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(event)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1" 
                    onClick={async () => {
                      if (!isAuthenticated()) {
                        toast({
                          title: "Please log in",
                          description: "You need to be logged in to join events",
                          variant: "destructive",
                        });
                        navigate('/auth');
                        return;
                      }
                      
                      try {
                        await registerForEvent(event.id);
                        toast({
                          title: "Success!",
                          description: `You've joined "${event.title}"`,
                        });
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to join event",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Join Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>
      
      <EventDetailsDialog 
        event={selectedEvent}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </Layout>
  );
};

export default Events;