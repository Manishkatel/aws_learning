import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Share, DollarSign, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { registerForEvent } from "@/services/django-events";
import { isAuthenticated, getCurrentUser } from "@/services/django-auth";
import { useNavigate } from "react-router-dom";

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

interface EventDetailsDialogProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventDetailsDialog = ({ event, isOpen, onClose }: EventDetailsDialogProps) => {
  const { toast } = useToast();
  const [isJoined, setIsJoined] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndMembership();
  }, [event, isOpen]);

  const navigate = useNavigate();

  const checkAuthAndMembership = async () => {
    if (!event) return;
    
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      
      // Note: We don't have a direct way to check if user joined, 
      // but we can try to register and catch errors
      // For now, we'll just set based on user existence
      setIsJoined(false); // This could be improved with a getEventAttendees check
    } else {
      setUser(null);
      setIsJoined(false);
    }
  };

  if (!event) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      // If dateString includes time separately, extract it
      if (dateString.includes('T')) {
        const timePart = dateString.split('T')[1]?.split(':').slice(0, 2).join(':');
        return timePart || '00:00';
      }
      return '00:00';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Career': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Academic': 'bg-green-100 text-green-800',
      'Workshop': 'bg-orange-100 text-orange-800',
      'Sports': 'bg-red-100 text-red-800',
      'Arts': 'bg-pink-100 text-pink-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleShareEvent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this event: ${event.title} by ${event.club}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${event.title} by ${event.club} - ${window.location.href}`);
      toast({
        title: "Link copied!",
        description: "Event link has been copied to clipboard",
      });
    }
  };

  const handleJoinEvent = async () => {
    if (!isAuthenticated()) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to join an event",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      await registerForEvent(event.id);
      setIsJoined(true);
      toast({
        title: "Successfully Joined!",
        description: `You've joined "${event.title}"`,
      });
    } catch (error: any) {
      if (error.message?.includes('already') || error.message?.includes('unique')) {
        setIsJoined(true);
        toast({
          title: "Already Joined",
          description: "You've already joined this event",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to join event",
          variant: "destructive",
        });
      }
    }
  };

  const handleLeaveEvent = async () => {
    // Note: Django API doesn't have a direct leave endpoint
    // You might need to implement this on the backend
    toast({
      title: "Feature not available",
      description: "Leave event functionality not yet implemented",
      variant: "destructive",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex-1">
            <DialogTitle className="text-2xl font-bold pr-4">{event.title}</DialogTitle>
            <p className="text-muted-foreground mt-1">by {event.club}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShareEvent}
            className="shrink-0 mr-8"
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category and Price Badges */}
          <div className="flex gap-2">
            <Badge className={getCategoryColor(event.category)} variant="secondary">
              {event.category}
            </Badge>
            {event.price === 0 ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                FREE
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {event.price}
              </Badge>
            )}
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{formatDate(event.date)}</p>
                <p className="text-sm text-muted-foreground">Date</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{formatTime(event.date)}</p>
                <p className="text-sm text-muted-foreground">Time</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{event.location}</p>
                <p className="text-sm text-muted-foreground">Location</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{event.attendees} interested</p>
                <p className="text-sm text-muted-foreground">Attendees</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">About this event</h3>
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          </div>

          {/* Additional Information */}
          {event.additional_info && (
            <div>
              <h3 className="font-semibold mb-2">Additional Details</h3>
              <p className="text-muted-foreground leading-relaxed">{event.additional_info}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center pt-4 border-t">
            {!isJoined ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" className="w-full md:w-auto px-12">
                    Join Event
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Join Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to join "{event.title}"? You'll receive updates about this event.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleJoinEvent}>
                      Yes, Join Event
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" variant="outline" className="w-full md:w-auto px-12">
                    Leave Event
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Leave Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to leave "{event.title}"? You'll no longer receive updates about this event.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeaveEvent}>
                      Yes, Leave Event
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsDialog;