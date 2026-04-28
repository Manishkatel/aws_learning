import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Clock, Eye, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getEvents } from "@/services/django-events";
import { DJANGO_API_URL } from "@/services/django-api";
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

// Mock events data as fallback
const mockEvents = [
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
  }
];

const EventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [starredEvents, setStarredEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const eventsData = await getEvents();
      
      const transformedEvents: Event[] = eventsData.slice(0, 4).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: `${event.event_date}T${event.event_time || '00:00:00'}`,
        location: event.location || '',
        club: event.club_name || 'Unknown Club',
        attendees: 0, // TODO: Get from API if available
        price: Number(event.price) || 0,
        category: event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1),
        additional_info: ''
      }));
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error:', error);
      setEvents(mockEvents.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Career': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Academic': 'bg-green-100 text-green-800',
      'Workshop': 'bg-orange-100 text-orange-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleStarEvent = (eventId: string) => {
    setStarredEvents(prev => {
      const newStarred = new Set(prev);
      if (newStarred.has(eventId)) {
        newStarred.delete(eventId);
      } else {
        newStarred.add(eventId);
      }
      return newStarred;
    });
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
    setIsDetailsOpen(false);
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading events...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Happening This Week</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Don't miss out on these exciting upcoming events on campus
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
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
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      by {event.club}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-muted-foreground ml-4">
                    {event.price === 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        FREE
                      </Badge>
                    ) : (
                      <Badge variant="outline">${event.price}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {event.description}
                </p>
                
                <div className="space-y-2 text-sm">
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
                    {event.attendees} interested
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(event)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button size="sm">
                    Join Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/events">
            <Button size="lg" variant="outline">
              View All Events
            </Button>
          </Link>
        </div>
      </div>
      
      <EventDetailsDialog 
        event={selectedEvent}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </section>
  );
};

export default EventsSection;