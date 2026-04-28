
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const MyEvents = () => {
  // Sample event data - in a real app, this would come from an API
  const [events, setEvents] = useState([
    {
      id: "1",
      title: "Summer BBQ Party",
      date: "August 15, 2025",
      time: "4:00 PM",
      location: "123 Party St, Funtown",
      theme: "classic"
    },
    {
      id: "2",
      title: "Birthday Celebration",
      date: "September 3, 2025",
      time: "7:00 PM",
      location: "456 Cake Ave, Partyville",
      theme: "celebration"
    },
    {
      id: "3",
      title: "Tech Meetup",
      date: "October 10, 2025",
      time: "6:30 PM",
      location: "789 Digital Blvd, Innovation City",
      theme: "minimalist"
    }
  ]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Events</h1>
          <Link to="/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Create New Event
            </Button>
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">You haven't created any events yet.</p>
            <Link to="/create">
              <Button>Create Your First Event</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                date={event.date}
                time={event.time}
                location={event.location}
                theme={event.theme}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyEvents;
