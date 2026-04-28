
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Features = () => {
  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-party-purple" />,
      title: "Beautiful event pages",
      description: "Create stunning event pages that reflect your personal style with customizable templates and themes."
    },
    {
      icon: <Clock className="h-8 w-8 text-party-pink" />,
      title: "Easy RSVP management",
      description: "Seamlessly collect and manage RSVPs, send reminders, and keep track of your guest list."
    },
    {
      icon: <ArrowRight className="h-8 w-8 text-party-purple" />,
      title: "Share with anyone",
      description: "Share your event page with friends and family through email, social media, or a simple link."
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Everything you need for your events</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            PartySpark provides all the tools you need to plan, create, and manage your events.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border border-border bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="p-3 bg-background rounded-full w-fit mb-4">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="p-0 hover:bg-transparent">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
