import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

interface Club {
  id: string;
  name: string;
  club_type?: string;
  category?: string;
}

interface ClubApplicationFormProps {
  club: Club;
  isOpen: boolean;
  onClose: () => void;
}

const ClubApplicationForm = ({ club, isOpen, onClose }: ClubApplicationFormProps) => {
  console.log('ClubApplicationForm - club prop:', club);
  console.log('ClubApplicationForm - club.category:', club?.category);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    studentId: "",
    major: "",
    graduationYear: "",
    profilePhoto: null as File | null,
    previousExperience: "",
    whyJoin: "",
    skills: "",
    availability: "",
    commitmentLevel: "",
    hasLeadershipExperience: false,
    leadershipDetails: "",
    agreeToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Store application in localStorage
      const applications = JSON.parse(localStorage.getItem('clubApplications') || '[]');
      const newApplication = {
        id: Date.now().toString(),
        clubId: club.id,
        clubName: club.name,
        ...formData,
        profilePhoto: formData.profilePhoto?.name || null,
        submissionDate: new Date().toISOString(),
        status: 'pending'
      };
      applications.push(newApplication);
      localStorage.setItem('clubApplications', JSON.stringify(applications));

      toast({
        title: "Application Submitted!",
        description: `Your application to join ${club.name} has been submitted successfully. You'll hear back from the club leaders soon.`,
      });

      onClose();
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        studentId: "",
        major: "",
        graduationYear: "",
        profilePhoto: null,
        previousExperience: "",
        whyJoin: "",
        skills: "",
        availability: "",
        commitmentLevel: "",
        hasLeadershipExperience: false,
        leadershipDetails: "",
        agreeToTerms: false,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Join {club.name}</DialogTitle>
          <DialogDescription>
            Fill out this application form to join our {(club.club_type || club.category || 'club').toLowerCase()} club. All fields are required unless marked optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange("studentId", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="major">Major/Field of Study</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => handleInputChange("major", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="graduationYear">Expected Graduation Year</Label>
                <Input
                  id="graduationYear"
                  value={formData.graduationYear}
                  onChange={(e) => handleInputChange("graduationYear", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="profilePhoto">Profile Photo (Optional)</Label>
              <div className="mt-2">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photoUpload')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Button>
                  {formData.profilePhoto && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{formData.profilePhoto.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInputChange("profilePhoto", null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  id="photoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Experience & Interest */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Experience & Interest</h3>
            
            <div>
              <Label htmlFor="previousExperience">Previous Relevant Experience</Label>
              <Textarea
                id="previousExperience"
                value={formData.previousExperience}
                onChange={(e) => handleInputChange("previousExperience", e.target.value)}
                placeholder="Describe any relevant experience, projects, or activities..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="whyJoin">Why do you want to join this club?</Label>
              <Textarea
                id="whyJoin"
                value={formData.whyJoin}
                onChange={(e) => handleInputChange("whyJoin", e.target.value)}
                placeholder="Tell us about your motivation and what you hope to achieve..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="skills">Relevant Skills</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="List any skills, technologies, or expertise you can contribute..."
                rows={2}
              />
            </div>
          </div>

          {/* Availability & Commitment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Availability & Commitment</h3>
            
            <div>
              <Label htmlFor="availability">Weekly Availability</Label>
              <Textarea
                id="availability"
                value={formData.availability}
                onChange={(e) => handleInputChange("availability", e.target.value)}
                placeholder="Describe your weekly schedule and availability for club activities..."
                rows={2}
                required
              />
            </div>

            <div>
              <Label>Commitment Level</Label>
              <RadioGroup
                value={formData.commitmentLevel}
                onValueChange={(value) => handleInputChange("commitmentLevel", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="casual" id="casual" />
                  <Label htmlFor="casual">Casual - Attend events when possible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regular" id="regular" />
                  <Label htmlFor="regular">Regular - Active participation in most activities</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dedicated" id="dedicated" />
                  <Label htmlFor="dedicated">Dedicated - Highly involved, interested in leadership roles</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Leadership Experience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Leadership Experience</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasLeadershipExperience"
                checked={formData.hasLeadershipExperience}
                onCheckedChange={(checked) => handleInputChange("hasLeadershipExperience", checked)}
              />
              <Label htmlFor="hasLeadershipExperience">
                I have previous leadership experience
              </Label>
            </div>

            {formData.hasLeadershipExperience && (
              <div>
                <Label htmlFor="leadershipDetails">Leadership Experience Details</Label>
                <Textarea
                  id="leadershipDetails"
                  value={formData.leadershipDetails}
                  onChange={(e) => handleInputChange("leadershipDetails", e.target.value)}
                  placeholder="Describe your leadership roles and responsibilities..."
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked)}
                required
              />
              <Label htmlFor="agreeToTerms" className="text-sm">
                I agree to the club's terms and conditions and commit to respectful participation
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.agreeToTerms}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClubApplicationForm;