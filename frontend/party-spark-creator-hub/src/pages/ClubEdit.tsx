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
import {
  addAchievement,
  addBoardMember,
  deleteAchievement,
  getAchievements,
  getBoardMembers,
  getClub,
  removeBoardMember,
  updateAchievement,
  updateBoardMember,
  updateClub,
  uploadBoardMemberPhoto,
  uploadClubLogo,
} from "@/services/django-clubs";
import { isAuthenticated, getCurrentUser } from "@/services/django-auth";
import { BoardMemberForm, BoardMember } from "@/components/clubs/BoardMemberForm";
import { AchievementForm, Achievement } from "@/components/clubs/AchievementForm";
import { ProfilePictureUpload } from "@/components/auth/ProfilePictureUpload";
import { DJANGO_API_URL } from "@/services/django-api";

const ClubEdit = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialBoardMemberIds, setInitialBoardMemberIds] = useState<string[]>([]);
  const [initialAchievementIds, setInitialAchievementIds] = useState<string[]>([]);
  const [clubLogo, setClubLogo] = useState<File | null>(null);
  const [existingClubLogoUrl, setExistingClubLogoUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    club_type: "",
    custom_type: ""
  });
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchClub();
  }, [clubId]);

  const checkAuthAndFetchClub = async () => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }
    
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (!clubId) {
      navigate('/clubs');
      return;
    }

    try {
      // Fetch club data
      const clubData = await getClub(clubId);
      
      // Check if user is the owner
      if (String(currentUser?.id) !== String(clubData.owner_id)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to edit this club.",
          variant: "destructive",
        });
        navigate('/clubs');
        return;
      }

      setFormData({
        name: clubData.name || "",
        description: clubData.description || "",
        contact_email: clubData.contact_email || "",
        contact_phone: clubData.contact_phone || "",
        website: clubData.website || "",
        club_type: clubData.club_type || "",
        custom_type: clubData.custom_type || ""
      });
      const logoUrl = clubData.logo_url || clubData.logo;
      setExistingClubLogoUrl(
        logoUrl
          ? logoUrl.startsWith('http') ? logoUrl : `${DJANGO_API_URL}${logoUrl}`
          : null
      );

      const [boardMembersData, achievementsData] = await Promise.all([
        getBoardMembers(clubId),
        getAchievements(clubId),
      ]);

      setBoardMembers(boardMembersData.map((member) => ({
        id: String(member.id),
        name: member.name || "",
        position: member.position || "",
        email: member.email || "",
        year_in_college: member.year_in_college || "",
        joined_date: member.joined_date || new Date().toISOString().split('T')[0],
        photo: null,
      })));
      setAchievements(achievementsData.map((achievement) => ({
        id: String(achievement.id),
        title: achievement.title || "",
        description: achievement.description || "",
        date_achieved: achievement.date_achieved || "",
      })));
      setInitialBoardMemberIds(boardMembersData.map((member) => String(member.id)));
      setInitialAchievementIds(achievementsData.map((achievement) => String(achievement.id)));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Club not found or you don't have permission to edit it.",
        variant: "destructive",
      });
      navigate('/clubs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clubId) return;

    setLoading(true);
    
    try {
      const invalidMembers = boardMembers.filter(member => !member.name.trim());
      if (invalidMembers.length > 0) {
        toast({
          title: "Invalid Board Members",
          description: "Please fill in the name for all board members or remove empty ones.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const invalidAchievements = achievements.filter(achievement => !achievement.title.trim());
      if (invalidAchievements.length > 0) {
        toast({
          title: "Invalid Achievements",
          description: "Please fill in the title for all achievements or remove empty ones.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const updateData = {
        name: formData.name,
        description: formData.description,
        club_type: formData.club_type === 'other' ? 'other' : formData.club_type,
        custom_type: formData.club_type === 'other' ? formData.custom_type : undefined,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone || undefined,
        website: formData.website || undefined,
      };

      await updateClub(clubId, updateData);
      if (clubLogo) {
        await uploadClubLogo(clubId, clubLogo);
      }

      const currentBoardMemberIds = new Set(boardMembers.map(member => member.id));
      const removedBoardMemberIds = initialBoardMemberIds.filter(id => !currentBoardMemberIds.has(id));
      await Promise.all(removedBoardMemberIds.map(id => removeBoardMember(id)));
      await Promise.all(boardMembers.map(async (member) => {
        const payload = {
          club_id: clubId,
          name: member.name.trim(),
          position: member.position.trim() || undefined,
          email: member.email.trim() || undefined,
          year_in_college: member.year_in_college || undefined,
          joined_date: member.joined_date || new Date().toISOString().split('T')[0],
        };

        const savedMember = initialBoardMemberIds.includes(member.id)
          ? updateBoardMember(member.id, payload)
          : addBoardMember(payload);

        const boardMemberData = await savedMember;
        if (member.photo) {
          await uploadBoardMemberPhoto(boardMemberData.id, member.photo);
        }
      }));

      const currentAchievementIds = new Set(achievements.map(achievement => achievement.id));
      const removedAchievementIds = initialAchievementIds.filter(id => !currentAchievementIds.has(id));
      await Promise.all(removedAchievementIds.map(id => deleteAchievement(id)));
      await Promise.all(achievements.map(achievement => {
        const payload = {
          club_id: clubId,
          title: achievement.title.trim(),
          description: achievement.description.trim() || undefined,
          date_achieved: achievement.date_achieved || undefined,
        };

        return initialAchievementIds.includes(achievement.id)
          ? updateAchievement(achievement.id, payload)
          : addAchievement(payload);
      }));

      toast({
        title: "Success!",
        description: "Club, board members, and achievements updated successfully"
      });
      
      navigate(`/club/${clubId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update club",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clubTypes = [
    { value: 'academic', label: 'Academic' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'technical', label: 'Technical' },
    { value: 'arts', label: 'Arts' },
    { value: 'social', label: 'Social' },
    { value: 'professional', label: 'Professional' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pt-8 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Edit Club</CardTitle>
            <CardDescription>
              Update your club information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Club Logo</Label>
                <ProfilePictureUpload
                  onImageChange={setClubLogo}
                  fullName={formData.name || "Club"}
                  initialImageUrl={existingClubLogoUrl}
                  label="Club Logo"
                  buttonLabel="Upload Club Logo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  placeholder="Enter your club name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="club_type">Club Type *</Label>
                <Select value={formData.club_type} onValueChange={(value) => handleInputChange("club_type", value)}>
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

              {formData.club_type === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="custom_type">Custom Type *</Label>
                  <Input
                    id="custom_type"
                    value={formData.custom_type}
                    onChange={(e) => handleInputChange("custom_type", e.target.value)}
                    required
                    placeholder="Enter custom club type"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your club's mission and activities"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange("contact_email", e.target.value)}
                  required
                  placeholder="contact@yourclub.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://yourclub.com"
                />
              </div>

              <BoardMemberForm
                boardMembers={boardMembers}
                setBoardMembers={setBoardMembers}
              />

              <AchievementForm
                achievements={achievements}
                setAchievements={setAchievements}
              />

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(`/club/${clubId}`)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Updating..." : "Update Club"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClubEdit;
