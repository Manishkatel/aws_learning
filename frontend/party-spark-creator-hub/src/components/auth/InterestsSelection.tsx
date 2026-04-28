import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const interests = [
  "Academic",
  "Sports", 
  "Workshops",
  "Technology",
  "Arts & Culture",
  "Music",
  "Photography",
  "Business",
  "Science",
  "Community Service",
  "Leadership",
  "Career Development",
  "Networking",
  "Research",
  "Social Events",
  "All Types"
];

interface InterestsSelectionProps {
  onInterestsChange: (interests: string[]) => void;
  selectedInterests: string[];
}

export const InterestsSelection = ({ onInterestsChange, selectedInterests }: InterestsSelectionProps) => {
  const handleInterestToggle = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    
    onInterestsChange(newInterests);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold">What are your interests?</Label>
        <p className="text-sm text-muted-foreground">
          Select the topics and activities you're interested in. This helps us recommend relevant events and clubs.
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-3">
            {interests.map((interest) => (
              <Button
                key={interest}
                type="button"
                variant={selectedInterests.includes(interest) ? "default" : "outline"}
                className="h-auto py-3 px-4 text-left justify-start"
                onClick={() => handleInterestToggle(interest)}
              >
                {interest}
              </Button>
            ))}
          </div>
          
          {selectedInterests.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-sm font-medium">Selected Interests:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedInterests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-xs text-muted-foreground">
        You can always update your interests later in your profile settings.
      </p>
    </div>
  );
};