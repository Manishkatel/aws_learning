import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ProfilePictureUpload } from "./ProfilePictureUpload";

const clubTypes = [
  { value: "academic", label: "Academic" },
  { value: "sports", label: "Sports" },
  { value: "cultural", label: "Cultural" },
  { value: "technical", label: "Technical" },
  { value: "social", label: "Social" },
  { value: "professional", label: "Professional" },
  { value: "other", label: "Other" }
];

interface ClubDetailsFormProps {
  clubName: string;
  setClubName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  clubType: string;
  setClubType: (type: string) => void;
  customType: string;
  setCustomType: (type: string) => void;
  contactEmail: string;
  setContactEmail: (email: string) => void;
  contactPhone: string;
  setContactPhone: (phone: string) => void;
  website: string;
  setWebsite: (website: string) => void;
  clubLogo: File | null;
  setClubLogo: (logo: File | null) => void;
}

export const ClubDetailsForm = ({
  clubName,
  setClubName,
  description,
  setDescription,
  clubType,
  setClubType,
  customType,
  setCustomType,
  contactEmail,
  setContactEmail,
  contactPhone,
  setContactPhone,
  website,
  setWebsite,
  clubLogo,
  setClubLogo
}: ClubDetailsFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold">Club Details</Label>
        <p className="text-sm text-muted-foreground">
          Please provide details about your club or organization.
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Club Logo</Label>
            <ProfilePictureUpload 
              onImageChange={setClubLogo}
              fullName={clubName || "Club"}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="club-name">Club/Organization Name *</Label>
            <Input
              id="club-name"
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Enter your club name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="club-description">Description *</Label>
            <Textarea
              id="club-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your club, its mission, and activities"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Club Type *</Label>
            <Select value={clubType} onValueChange={setClubType}>
              <SelectTrigger>
                <SelectValue placeholder="Select club type" />
              </SelectTrigger>
              <SelectContent>
                {clubTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clubType === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-type">Custom Club Type *</Label>
              <Input
                id="custom-type"
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Specify your club type"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email *</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="club@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone">Contact Phone</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourclub.com"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};