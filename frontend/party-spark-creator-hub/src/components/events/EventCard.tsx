
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  theme: string;
}

const EventCard = ({ id, title, date, time, location, theme }: EventCardProps) => {
  // Function to get theme-specific background class
  const getThemeClass = () => {
    switch (theme) {
      case 'celebration':
        return 'bg-gradient-to-r from-[#FEC6A1]/20 to-[#FEF7CD]/20';
      case 'minimalist':
        return 'bg-muted';
      case 'classic':
      default:
        return 'bg-gradient-to-r from-party-purple/10 to-party-pink/10';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-24 ${getThemeClass()}`} />
      <CardHeader className="pb-2">
        <h3 className="font-bold text-lg">{title}</h3>
      </CardHeader>
      <CardContent className="space-y-2 pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{time}</span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{location}</p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Link to={`/events/${id}`}>
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
