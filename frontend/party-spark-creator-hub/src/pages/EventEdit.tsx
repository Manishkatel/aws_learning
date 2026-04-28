import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getEvent, updateEvent } from "@/services/django-events";
import { isAuthenticated, getCurrentUser } from "@/services/django-auth";

const EventEdit = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    price: "",
    max_attendees: "",
    event_type: "workshop",
    is_virtual: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchEvent();
  }, [eventId]);

  const checkAuthAndFetchEvent = async () => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }
    
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (!eventId) {
      navigate('/events');
      return;
    }

    try {
      // Fetch event data
      const eventData = await getEvent(eventId);
      
      // Check if user is the creator
      if (currentUser?.id !== eventData.created_by) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to edit this event.",
          variant: "destructive",
        });
        navigate('/events');
        return;
      }

      // Format date and time for inputs
      const eventDate = eventData.event_date || "";
      const eventTime = eventData.event_time || "00:00";

      setFormData({
        title: eventData.title || "",
        description: eventData.description || "",
        event_date: eventDate,
        event_time: eventTime,
        location: eventData.location || "",
        price: eventData.price?.toString() || "0",
        max_attendees: eventData.max_attendees?.toString() || "",
        event_type: eventData.event_type || "workshop",
        is_virtual: eventData.is_virtual || false,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Event not found or you don't have permission to edit it.",
        variant: "destructive",
      });
      navigate('/events');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eventId) return;

    setLoading(true);
    
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        event_time: formData.event_time || "00:00",
        location: formData.location,
        price: formData.price ? parseFloat(formData.price) : 0,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        event_type: formData.event_type,
        is_virtual: formData.is_virtual,
      };

      await updateEvent(eventId, updateData);

      toast({
        title: "Success!",
        description: "Event updated successfully"
      });
      
      navigate('/my-events');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const eventTypes = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'conference', label: 'Conference' },
    { value: 'social', label: 'Social' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pt-8 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Edit Event</CardTitle>
            <CardDescription>
              Update your event information and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type *</Label>
                <Select value={formData.event_type} onValueChange={(value) => handleInputChange("event_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your event"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleInputChange("event_date", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_time">Event Time *</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => handleInputChange("event_time", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  required
                  placeholder="Event location"
                  disabled={formData.is_virtual}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_virtual"
                    checked={formData.is_virtual}
                    onChange={(e) => handleInputChange("is_virtual", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="is_virtual">Virtual Event</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Max Attendees</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    min="1"
                    value={formData.max_attendees}
                    onChange={(e) => handleInputChange("max_attendees", e.target.value)}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/my-events')} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Updating..." : "Update Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EventEdit;
