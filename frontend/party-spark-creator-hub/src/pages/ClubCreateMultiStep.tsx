import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, getCurrentUser, getUserProfile } from "@/services/django-auth";
import { createClub, uploadClubLogo, addBoardMember, addAchievement } from "@/services/django-clubs";
import { ClubDetailsForm } from "@/components/auth/ClubDetailsForm";
import { BoardMemberForm, BoardMember } from "@/components/clubs/BoardMemberForm";
import { AchievementForm, Achievement } from "@/components/clubs/AchievementForm";

const ClubCreateMultiStep = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const { toast } = useToast();

  // Club details
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [clubType, setClubType] = useState("");
  const [customType, setCustomType] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [clubLogo, setClubLogo] = useState<File | null>(null);

  // Board members and achievements
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const steps = [
    { id: 1, title: "Club Details", description: "Basic information about your club" },
    { id: 2, title: "Board Members", description: "Add your leadership team" },
    { id: 3, title: "Achievements", description: "Showcase your accomplishments" }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }
    
    try {
      const currentUser = getCurrentUser();
      const profile = await getUserProfile();
      
      setUser({ ...currentUser, ...profile });
    } catch (error: any) {
      console.error('Error checking auth:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
      navigate('/auth');
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!clubName || !description || !clubType || !contactEmail) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return false;
        }
        if (clubType === 'other' && !customType) {
          toast({
            title: "Missing Information",
            description: "Please specify the custom club type.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 2:
        const invalidMembers = boardMembers.filter(member => !member.name);
        if (invalidMembers.length > 0) {
          toast({
            title: "Invalid Board Members",
            description: "Please fill in the name for all board members or remove empty ones.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 3:
        const invalidAchievements = achievements.filter(achievement => !achievement.title);
        if (invalidAchievements.length > 0) {
          toast({
            title: "Invalid Achievements",
            description: "Please fill in the title for all achievements or remove empty ones.",
            variant: "destructive",
          });
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCreateClub = async () => {
    if (!validateStep()) {
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a club",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!isAuthenticated()) {
      toast({
        title: "Authentication Required",
        description: "Your session has expired. Please sign in again",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare club data - validation ensures these fields are filled
      const clubDataToSend: any = {
        name: clubName.trim(),
        description: description.trim() || '',
        contact_email: contactEmail.trim(),
      };

      // Add club_type (validation ensures it's provided)
      if (clubType && clubType.trim()) {
        const finalClubType = clubType === 'other' ? 'other' : clubType;
        clubDataToSend.club_type = finalClubType;
        
        // Add custom_type only if club_type is 'other' and customType is provided
        if (finalClubType === 'other' && customType && customType.trim()) {
          clubDataToSend.custom_type = customType.trim();
        }
      }

      // Add optional fields only if they have values
      if (contactPhone && contactPhone.trim()) {
        clubDataToSend.contact_phone = contactPhone.trim();
      }
      if (website && website.trim()) {
        clubDataToSend.website = website.trim();
      }

      console.log('Creating club with data:', clubDataToSend);
      console.log('API Endpoint:', '/api/clubs/');
      console.log('Full URL will be:', `${import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000'}/api/clubs/`);

      // Create club
      const clubData = await createClub(clubDataToSend);
      
      console.log('Club created successfully:', clubData);
      
      if (!clubData || !clubData.id) {
        throw new Error('Club creation failed: No club data returned');
      }

      // Upload logo if provided
      if (clubLogo && clubData.id) {
        try {
          await uploadClubLogo(clubData.id, clubLogo);
        } catch (logoError) {
          console.error("Error uploading logo:", logoError);
          // Don't fail the whole process if logo upload fails
        }
      }

      // Create board members
      if (boardMembers.length > 0 && clubData.id) {
        try {
          await Promise.all(
            boardMembers.map(member =>
              addBoardMember({
                club_id: clubData.id,
                name: member.name,
                position: member.position || undefined,
                email: member.email || undefined,
                year_in_college: member.year_in_college || undefined,
                joined_date: member.joined_date || new Date().toISOString().split('T')[0],
              })
            )
          );
        } catch (err) {
          console.error("Board members creation failed:", err);
          // Don't fail the whole process if board members fail
        }
      }

      // Create achievements
      if (achievements.length > 0 && clubData.id) {
        try {
          await Promise.all(
            achievements.map(achievement =>
              addAchievement({
                club_id: clubData.id,
                title: achievement.title,
                description: achievement.description || undefined,
                date_achieved: achievement.date_achieved || undefined,
              })
            )
          );
        } catch (err) {
          console.error("Achievements creation failed:", err);
          // Don't fail the whole process if achievements fail
        }
      }

      toast({
        title: "Success!",
        description: "Club created successfully!"
      });
      
      // Navigate to profile to see the new club, with a refresh trigger
      navigate('/profile', { 
        replace: true,
        state: { refresh: true, timestamp: Date.now() } // Force refresh
      });
    } catch (error: any) {
      console.error('Error creating club:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      
      let errorMessage = "Failed to create club";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-[400px]">
          <CardContent className="text-center py-12">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Create Your Club</CardTitle>
            <CardDescription className="text-center">
              Set up your club profile to start creating and managing events
            </CardDescription>
            <div className="mt-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex justify-center mt-4 space-x-4">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep > step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : currentStep === step.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <ClubDetailsForm
                clubName={clubName}
                setClubName={setClubName}
                description={description}
                setDescription={setDescription}
                clubType={clubType}
                setClubType={setClubType}
                customType={customType}
                setCustomType={setCustomType}
                contactEmail={contactEmail}
                setContactEmail={setContactEmail}
                contactPhone={contactPhone}
                setContactPhone={setContactPhone}
                website={website}
                setWebsite={setWebsite}
                clubLogo={clubLogo}
                setClubLogo={setClubLogo}
              />
            )}

            {currentStep === 2 && (
              <BoardMemberForm
                boardMembers={boardMembers}
                setBoardMembers={setBoardMembers}
              />
            )}

            {currentStep === 3 && (
              <AchievementForm
                achievements={achievements}
                setAchievements={setAchievements}
              />
            )}

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleCreateClub} disabled={loading}>
                  {loading ? "Creating Club..." : "Create Club"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClubCreateMultiStep;