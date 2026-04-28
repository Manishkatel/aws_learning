
import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import EventsSection from "@/components/home/EventsSection";
import ClubsSection from "@/components/home/ClubsSection";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <EventsSection />
      <ClubsSection />
    </Layout>
  );
};

export default Index;
