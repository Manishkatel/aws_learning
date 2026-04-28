import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date_achieved: string;
}

interface AchievementFormProps {
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
}

export const AchievementForm = ({ achievements, setAchievements }: AchievementFormProps) => {
  const addAchievement = () => {
    const newAchievement: Achievement = {
      id: Date.now().toString(),
      title: "",
      description: "",
      date_achieved: new Date().toISOString().split('T')[0]
    };
    setAchievements([...achievements, newAchievement]);
  };

  const updateAchievement = (id: string, field: keyof Achievement, value: string) => {
    setAchievements(achievements.map(achievement => 
      achievement.id === id ? { ...achievement, [field]: value } : achievement
    ));
  };

  const removeAchievement = (id: string) => {
    setAchievements(achievements.filter(achievement => achievement.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-lg font-semibold">Achievements</Label>
          <p className="text-sm text-muted-foreground">
            Showcase your club's accomplishments and milestones.
          </p>
        </div>
        <Button type="button" onClick={addAchievement} variant="outline">
          Add Achievement
        </Button>
      </div>

      {achievements.map((achievement) => (
        <Card key={achievement.id}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Achievement</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAchievement(achievement.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={achievement.title}
                onChange={(e) => updateAchievement(achievement.id, 'title', e.target.value)}
                placeholder="Achievement title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={achievement.description}
                onChange={(e) => updateAchievement(achievement.id, 'description', e.target.value)}
                placeholder="Describe the achievement..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Date Achieved</Label>
              <Input
                type="date"
                value={achievement.date_achieved}
                onChange={(e) => updateAchievement(achievement.id, 'date_achieved', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {achievements.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <p>No achievements added yet.</p>
            <p className="text-sm">Click "Add Achievement" to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
