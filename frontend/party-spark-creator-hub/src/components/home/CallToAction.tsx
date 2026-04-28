
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToAction = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-party-purple to-party-pink p-8 md:p-12">
          <div className="absolute right-0 bottom-0 w-64 h-64 opacity-20">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <path
                fill="#FFFFFF"
                d="M40.8,-68.7C52.3,-58.5,61.1,-46.4,66.7,-32.7C72.4,-19,74.8,-3.8,71.5,10.2C68.3,24.2,59.2,37,48,46.4C36.8,55.8,23.4,61.8,8.9,66.3C-5.5,70.8,-21.1,73.9,-34.9,70.2C-48.7,66.4,-60.6,56,-68.9,42.3C-77.2,28.6,-81.9,11.7,-79.4,-3.7C-76.9,-19.1,-67.3,-33,-56.6,-45.7C-45.9,-58.3,-34.1,-69.8,-20.5,-75.3C-6.9,-80.9,8.5,-80.5,22.1,-76.9C35.7,-73.2,49.1,-66.4,57.6,-56.8C66.2,-47.1,69.9,-34.7,40.8,-68.7Z"
                transform="translate(100 100)"
              />
            </svg>
          </div>
          <div className="relative">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white">Ready to create your event?</h2>
              <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto lg:mx-0">
                Start planning your next gathering with PartySpark. It's free to create your first event!
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link to="/events">
                  <Button size="lg" variant="secondary" className="font-semibold">
                    View Events
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20 hover:text-white">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction; 
