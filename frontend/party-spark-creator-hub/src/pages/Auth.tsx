import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loginUser, signupUser, isAuthenticated, getCurrentUser } from "@/services/django-auth";
import { apiUploadFile, API_ENDPOINTS } from "@/services/django-api";
import { ProfilePictureUpload } from "@/components/auth/ProfilePictureUpload";
import { InterestsSelection } from "@/components/auth/InterestsSelection";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  
  // Multi-step signup states
  const [signupStep, setSignupStep] = useState(1);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [yearInCollege, setYearInCollege] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleBasicSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    // Move to next step for additional info
    setSignupStep(2);
  };

  const handleCompleteSignup = async () => {
    setLoading(true);

    try {
      // Validate required fields
      if (!email || !password || !confirmPassword || !fullName) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (email, password, confirm password, full name)",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Signup with Django API
      const signupData: any = {
        email: email.trim(),
        password,
        password_confirm: confirmPassword,
        full_name: fullName.trim(),
      };
      
      // Only include optional fields if they have values
      if (interests.length > 0) {
        signupData.interests = interests;
      }
      
      if (yearInCollege && yearInCollege.trim()) {
        signupData.year_in_college = yearInCollege.trim();
      }
      
      console.log('Sending signup data:', { ...signupData, password: '***', password_confirm: '***' });
      
      const response = await signupUser(signupData);

      // If profile picture was uploaded, upload it separately
      if (profilePicture) {
        try {
          await apiUploadFile(
            API_ENDPOINTS.UPLOAD_PROFILE_PICTURE,
            profilePicture,
            'picture'
          );
        } catch (uploadError) {
          console.error('Profile picture upload failed:', uploadError);
          // Continue even if picture upload fails
        }
      }

      toast({
        title: "Success!",
        description: "Account created successfully! Welcome aboard!",
      });
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error: any) {
      console.error('Signup error:', error);
      console.error('Error details:', error.message, error.stack);
      
      let errorMessage = "Failed to create account";
      if (error.message) {
        errorMessage = error.message;
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

  const handleBackToStep1 = () => {
    setSignupStep(1);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await loginUser({ email, password });

      toast({
        title: "Success!",
        description: "Signed in successfully!",
      });
      
      // Redirect to home
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error: any) {
      let errorMessage = "Failed to sign in";
      
      if (error.message?.includes("Invalid") || error.message?.includes("incorrect")) {
        errorMessage = "Invalid email or password";
      } else if (error.message) {
        errorMessage = error.message;
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Event Platform</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showSigninPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSigninPassword(!showSigninPassword)}
                    >
                      {showSigninPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              {signupStep === 1 && (
                <form onSubmit={handleBasicSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Re-enter your password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                   
                   <Button type="submit" className="w-full">
                     Continue
                   </Button>
                </form>
              )}

              {signupStep === 2 && (
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToStep1}
                    className="mb-4 p-0 h-auto"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <ProfilePictureUpload
                    onImageChange={setProfilePicture}
                    fullName={fullName}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="year">Year in College</Label>
                    <Input
                      id="year"
                      type="text"
                      value={yearInCollege}
                      onChange={(e) => setYearInCollege(e.target.value)}
                      placeholder="e.g., Freshman, Sophomore..."
                    />
                  </div>

                  <InterestsSelection
                    onInterestsChange={setInterests}
                    selectedInterests={interests}
                  />

                  <Button 
                    onClick={handleCompleteSignup} 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Complete Sign Up"}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
