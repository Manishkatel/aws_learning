import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Users, LogOut, Sun, Moon, Settings } from "lucide-react";
import { User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, getCurrentUser, getUserProfile, logoutUser } from "@/services/django-auth";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    // Check auth state periodically (every 30 seconds) to keep user state updated
    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      
      // Fetch user profile
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      }
    } else {
      setUser(null);
      setProfile(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      
      setUser(null);
      setProfile(null);
      
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
      
      // Redirect to home
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-usm-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-2xl font-bold gradient-text">Golden Eagles Events</span>
            </Link>
          </div>   
          
          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link to="/" className="text-foreground/80 hover:text-foreground px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link to="/events" className="text-foreground/80 hover:text-foreground px-3 py-2 rounded-md text-sm font-medium">
                Events
              </Link>
              <Link to="/clubs" className="text-foreground/80 hover:text-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Clubs
              </Link>
              {/* User menu items removed */}
              {/* Always show the user section if we're not on /auth page */}
              {(user || window.location.pathname !== '/auth') && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-2"
                  >
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              {profile?.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-1 leading-none">
                            <p className="font-medium">{profile?.full_name || user?.full_name || 'User'}</p>
                            <p className="w-[200px] truncate text-sm text-muted-foreground">
                              {profile?.email || user?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link 
                            to="/profile" 
                            className="cursor-pointer"
                          >
                            <UserIcon className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button variant="default" asChild>
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="text-foreground hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/events" 
              className="text-foreground hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            <Link 
              to="/clubs" 
              className="text-foreground hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <Users className="w-4 h-4 mr-2" />
              Clubs
            </Link>
            {user && (
              <>
                {/* Mobile user menu items removed */}
                <div className="border-t pt-2">
                  <Link 
                    to="/profile"
                    className="text-foreground hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </div>
                <div className="border-t pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-full justify-start"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-4 h-4 mr-2" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 mr-2" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                  <button
                    onClick={handleSignOut}
                    className="text-foreground hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium w-full text-left flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
            {!user && (
              <div className="pt-2 space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full justify-start"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Dark Mode
                    </>
                  )}
                </Button>
                <Button variant="default" className="w-full" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
