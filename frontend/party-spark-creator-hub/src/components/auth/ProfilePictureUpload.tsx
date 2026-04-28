import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User } from "lucide-react";

interface ProfilePictureUploadProps {
  onImageChange: (file: File | null) => void;
  fullName: string;
}

export const ProfilePictureUpload = ({ onImageChange, fullName }: ProfilePictureUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageChange(file);
    } else {
      setPreview(null);
      onImageChange(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-4">
      <Label>Profile Picture (Optional)</Label>
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="w-24 h-24 cursor-pointer" onClick={handleClick}>
          <AvatarImage src={preview || undefined} alt="Profile picture" />
          <AvatarFallback className="text-lg bg-muted">
            {fullName ? getInitials(fullName) : <User className="w-8 h-8" />}
          </AvatarFallback>
        </Avatar>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleClick}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Profile Picture
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <p className="text-sm text-muted-foreground text-center">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>
    </div>
  );
};