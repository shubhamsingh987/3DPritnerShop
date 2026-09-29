import Hero from "@/components/home/Hero";
import Collection from "@/components/home/Collection";
import Testimonials from "@/components/home/Testimonials";
import About from "@/components/home/About";
import FinalCta from "@/components/home/FinalCta";

export default function Home() {
  return (
    <>
      <Hero />
      <Collection />
      <Testimonials />
      <About />
      <FinalCta />
    </>
  );
}
