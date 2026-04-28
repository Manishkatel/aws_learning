import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfilePictureUpload } from "@/components/auth/ProfilePictureUpload";
import { X } from "lucide-react";

const yearOptions = [
  "Freshman",
  "Sophomore", 
  "Junior",
  "Senior",
  "Graduate",
  "Alumni",
  "Other"
];

export interface BoardMember {
  id: string;
  name: string;
  position: string;
  email: string;
  year_in_college: string;
  joined_date: string;
  photo: File | null;
}

interface BoardMemberFormProps {
  boardMembers: BoardMember[];
  setBoardMembers: (members: BoardMember[]) => void;
}

export const BoardMemberForm = ({ boardMembers, setBoardMembers }: BoardMemberFormProps) => {
  const addBoardMember = () => {
    const newMember: BoardMember = {
      id: Date.now().toString(),
      name: "",
      position: "",
      email: "",
      year_in_college: "",
      joined_date: new Date().toISOString().split('T')[0],
      photo: null
    };
    setBoardMembers([...boardMembers, newMember]);
  };

  const updateBoardMember = (id: string, field: keyof BoardMember, value: any) => {
    setBoardMembers(boardMembers.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const removeBoardMember = (id: string) => {
    setBoardMembers(boardMembers.filter(member => member.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-lg font-semibold">Board Members</Label>
          <p className="text-sm text-muted-foreground">
            Add your club's board members and leadership team.
          </p>
        </div>
        <Button type="button" onClick={addBoardMember} variant="outline">
          Add Member
        </Button>
      </div>

      {boardMembers.map((member) => (
        <Card key={member.id}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Board Member</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeBoardMember(member.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Photo</Label>
              <ProfilePictureUpload 
                onImageChange={(file) => updateBoardMember(member.id, 'photo', file)}
                fullName={member.name || "Member"}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={member.name}
                  onChange={(e) => updateBoardMember(member.id, 'name', e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={member.position}
                  onChange={(e) => updateBoardMember(member.id, 'position', e.target.value)}
                  placeholder="e.g., President, Secretary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={member.email}
                  onChange={(e) => updateBoardMember(member.id, 'email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Year in College</Label>
                <Select 
                  value={member.year_in_college} 
                  onValueChange={(value) => updateBoardMember(member.id, 'year_in_college', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toLowerCase()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Joined Date</Label>
              <Input
                type="date"
                value={member.joined_date}
                onChange={(e) => updateBoardMember(member.id, 'joined_date', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {boardMembers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <p>No board members added yet.</p>
            <p className="text-sm">Click "Add Member" to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};