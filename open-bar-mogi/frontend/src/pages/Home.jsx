import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import PackageSection from "../components/PackageSection";
import HowItWorksSection from "../components/HowItWorks";
import DrinksSection from "../components/DrinksSection";
import GallerySection from "../components/GalerySection";
import CTASection from "../components/CTAsection";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="bg-zinc-950 text-white min-h-screen">
      <Navbar />
      <HeroSection />
      <PackageSection />
      <HowItWorksSection />
      <DrinksSection />
      <GallerySection />
      <CTASection />
      <Footer />
    </div>
  );
}

export default Home;