import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Bell, Mail, Smartphone } from "lucide-react";

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

interface EventReminderDialogProps {
  event: ClubEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventReminderDialog = ({ event, isOpen, onClose }: EventReminderDialogProps) => {
  const { toast } = useToast();
  const [reminderSettings, setReminderSettings] = useState({
    timing: "1hour", // 15min, 1hour, 1day, 1week
    methods: {
      notification: true,
      email: false,
      sms: false,
    },
    includeLocation: true,
    includeDescription: true,
  });
  const [isSettingReminder, setIsSettingReminder] = useState(false);

  const handleMethodChange = (method: string, checked: boolean) => {
    setReminderSettings(prev => ({
      ...prev,
      methods: {
        ...prev.methods,
        [method]: checked,
      },
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimingLabel = (timing: string) => {
    switch (timing) {
      case "15min": return "15 minutes before";
      case "1hour": return "1 hour before";
      case "1day": return "1 day before";
      case "1week": return "1 week before";
      default: return "1 hour before";
    }
  };

  const handleSetReminder = async () => {
    if (!event) return;

    setIsSettingReminder(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store reminder in localStorage
      const reminders = JSON.parse(localStorage.getItem('eventReminders') || '[]');
      const newReminder = {
        id: Date.now().toString(),
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        eventDescription: event.description,
        timing: reminderSettings.timing,
        methods: reminderSettings.methods,
        includeLocation: reminderSettings.includeLocation,
        includeDescription: reminderSettings.includeDescription,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      reminders.push(newReminder);
      localStorage.setItem('eventReminders', JSON.stringify(reminders));

      // If browser supports notifications, request permission
      if (reminderSettings.methods.notification && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }

      toast({
        title: "Reminder Set!",
        description: `You'll be reminded about "${event.title}" ${getTimingLabel(reminderSettings.timing).toLowerCase()}.`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingReminder(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Event Reminder
          </DialogTitle>
          <DialogDescription>
            Configure your reminder preferences for this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold">{event.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{event.time}</span>
            </div>
          </div>

          {/* Reminder Timing */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Remind me:</Label>
            <RadioGroup
              value={reminderSettings.timing}
              onValueChange={(value) => setReminderSettings(prev => ({ ...prev, timing: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="15min" id="15min" />
                <Label htmlFor="15min">15 minutes before</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1hour" id="1hour" />
                <Label htmlFor="1hour">1 hour before</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1day" id="1day" />
                <Label htmlFor="1day">1 day before</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1week" id="1week" />
                <Label htmlFor="1week">1 week before</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Reminder Methods */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Notification method:</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notification"
                  checked={reminderSettings.methods.notification}
                  onCheckedChange={(checked) => handleMethodChange("notification", checked as boolean)}
                />
                <Label htmlFor="notification" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Browser notification
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={reminderSettings.methods.email}
                  onCheckedChange={(checked) => handleMethodChange("email", checked as boolean)}
                />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email reminder
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={reminderSettings.methods.sms}
                  onCheckedChange={(checked) => handleMethodChange("sms", checked as boolean)}
                />
                <Label htmlFor="sms" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  SMS reminder
                </Label>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Include in reminder:</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeLocation"
                  checked={reminderSettings.includeLocation}
                  onCheckedChange={(checked) => setReminderSettings(prev => ({ ...prev, includeLocation: checked as boolean }))}
                />
                <Label htmlFor="includeLocation">Event location</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDescription"
                  checked={reminderSettings.includeDescription}
                  onCheckedChange={(checked) => setReminderSettings(prev => ({ ...prev, includeDescription: checked as boolean }))}
                />
                <Label htmlFor="includeDescription">Event description</Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSetReminder}
              disabled={isSettingReminder || (!reminderSettings.methods.notification && !reminderSettings.methods.email && !reminderSettings.methods.sms)}
              className="bg-primary hover:bg-primary/90"
            >
              {isSettingReminder ? "Setting..." : "Set Reminder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventReminderDialog;