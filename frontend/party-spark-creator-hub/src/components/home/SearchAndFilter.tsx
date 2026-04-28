import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Calendar as CalendarIcon, Users, MapPin, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  type: 'event' | 'club';
  description: string;
  category: string;
  date?: string;
  location?: string;
  members?: number;
  attendees?: number;
  price?: number;
  rating?: number;
}

// Mock data combining events and clubs
const mockSearchData: SearchResult[] = [
  // Events
  {
    id: "e1",
    type: "event",
    title: "Tech Career Fair 2024",
    description: "Meet top tech companies and discover internship opportunities",
    category: "Career",
    date: "2024-03-15",
    location: "Engineering Building",
    attendees: 234,
    price: 0
  },
  {
    id: "e2",
    type: "event",
    title: "Spring Music Festival",
    description: "Live performances by student bands and local artists",
    category: "Entertainment",
    date: "2024-03-20",
    location: "Campus Quad",
    attendees: 156,
    price: 15
  },
  {
    id: "e3",
    type: "event",
    title: "Research Symposium",
    description: "Student research presentations across all disciplines",
    category: "Academic",
    date: "2024-03-18",
    location: "Academic Center",
    attendees: 89,
    price: 0
  },
  {
    id: "e4",
    type: "event",
    title: "Basketball Tournament",
    description: "Inter-department basketball championship",
    category: "Sports",
    date: "2024-03-25",
    location: "Sports Complex",
    attendees: 312,
    price: 0
  },
  // Clubs
  {
    id: "c1",
    type: "club",
    title: "Computer Science Club",
    description: "Building the future through code. Weekly hackathons and tech talks",
    category: "Technology",
    members: 284,
    rating: 4.8
  },
  {
    id: "c2",
    type: "club",
    title: "Photography Society",
    description: "Capture moments that matter. Photo walks and workshops",
    category: "Arts",
    members: 156,
    rating: 4.6
  },
  {
    id: "c3",
    type: "club",
    title: "Debate Team",
    description: "Sharpen your argumentation skills and public speaking",
    category: "Academic",
    members: 89,
    rating: 4.9
  },
  {
    id: "c4",
    type: "club",
    title: "Hiking Club",
    description: "Explore the great outdoors with weekend adventures",
    category: "Outdoor",
    members: 203,
    rating: 4.7
  }
];

const SearchAndFilter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [priceFilter, setPriceFilter] = useState("all");
  const [showResults, setShowResults] = useState(false);

  const categories = ["Technology", "Arts", "Academic", "Sports", "Entertainment", "Career", "Workshop", "Outdoor"];

  const filteredResults = mockSearchData.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase();
    
    const matchesPrice = priceFilter === "all" || 
      (priceFilter === "free" && (item.price === 0 || item.type === "club")) ||
      (priceFilter === "paid" && item.price && item.price > 0);

    let matchesDate = true;
    if (item.date && (dateFrom || dateTo)) {
      const itemDate = new Date(item.date);
      if (dateFrom && itemDate < dateFrom) matchesDate = false;
      if (dateTo && itemDate > dateTo) matchesDate = false;
    }

    return matchesSearch && matchesType && matchesCategory && matchesPrice && matchesDate;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Arts': 'bg-purple-100 text-purple-800',
      'Academic': 'bg-green-100 text-green-800',
      'Sports': 'bg-red-100 text-red-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Career': 'bg-indigo-100 text-indigo-800',
      'Workshop': 'bg-orange-100 text-orange-800',
      'Outdoor': 'bg-teal-100 text-teal-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Enhanced Search Form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Main Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search events, clubs, activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="event">Events Only</SelectItem>
                  <SelectItem value="club">Clubs Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category.toLowerCase()}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Filter */}
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="free">Free Only</SelectItem>
                  <SelectItem value="paid">Paid Events</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Search Button */}
            <Button type="submit" className="w-full md:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Search & Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {showResults && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {filteredResults.length} Results Found
            </h3>
            {(searchQuery || typeFilter !== "all" || categoryFilter !== "all") && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                  setPriceFilter("all");
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setShowResults(false);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or explore our featured events and clubs below.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredResults.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={item.type === 'event' ? 'default' : 'secondary'}>
                            {item.type === 'event' ? 'Event' : 'Club'}
                          </Badge>
                          <Badge className={getCategoryColor(item.category)} variant="secondary">
                            {item.category}
                          </Badge>
                          {item.price === 0 && item.type === 'event' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              FREE
                            </Badge>
                          )}
                          {item.price && item.price > 0 && (
                            <Badge variant="outline">${item.price}</Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                        <p className="text-muted-foreground mb-3">{item.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {item.date && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(item.date)}</span>
                            </div>
                          )}
                          {item.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{item.location}</span>
                            </div>
                          )}
                          {item.members && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{item.members} members</span>
                            </div>
                          )}
                          {item.attendees && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{item.attendees} interested</span>
                            </div>
                          )}
                          {item.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{item.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link to={item.type === 'event' ? `/events` : `/club/${item.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button size="sm">
                          {item.type === 'event' ? 'Join Event' : 'Join Club'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;