import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import TeamSection from './components/TeamSection';
import RecordSection from './components/RecordSection';
import ResourceHubSection from './components/ResourceHubSection';
import RatingsSection from './components/RatingsSection';
import FAQsSection from './components/FAQsSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  
  // Shared state for portfolio checkout redirects
  const [preSelectedService, setPreSelectedService] = useState('');
  const [preSelectedPortfolio, setPreSelectedPortfolio] = useState('');

  // Scroll spy to highlight active menu section
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
      const scrollPosition = window.scrollY + 200; // Offset for sticky navbar

      const sections = [
        { id: 'hero', element: document.getElementById('hero') },
        { id: 'records', element: document.getElementById('records') },
        { id: 'services', element: document.getElementById('services') },
        { id: 'portfolio', element: document.getElementById('portfolio') },
        { id: 'ratings', element: document.getElementById('ratings') },
        { id: 'resources', element: document.getElementById('resources') },
        { id: 'team', element: document.getElementById('team') },
        { id: 'faqs', element: document.getElementById('faqs') },
        { id: 'contact', element: document.getElementById('contact') }
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        if (sec.element) {
          const offsetTop = sec.element.offsetTop;
          if (scrollPosition >= offsetTop) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (sectionId: string) => {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      // Offset scroll height to account for sticky navbar
      const yOffset = -80; 
      const y = targetElement.getBoundingClientRect().top + window.scrollY + yOffset;
      
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const handleOrderNow = (serviceName: string, portfolioTitle?: string) => {
    setPreSelectedService(serviceName);
    if (portfolioTitle) {
      setPreSelectedPortfolio(portfolioTitle);
    } else {
      setPreSelectedPortfolio('');
    }

    // Scroll smoothly to contact section
    handleNavigate('contact');
  };

  return (
    <div className="min-h-screen bg-japandi-bg text-japandi-soot antialiased flex flex-col justify-between selection:bg-japandi-earth/15 selection:text-japandi-earth">
      
      {/* Sticky Navbar */}
      <Navbar 
        activeSection={activeSection} 
        onNavigate={handleNavigate} 
        onSelectService={setSelectedServiceId} 
      />

      {/* Main Content Sections */}
      <main className="flex-grow">
        
        {/* 1. Hero Landing Page */}
        <Hero 
          onExplore={() => handleNavigate('services')} 
          onBook={() => handleNavigate('contact')} 
        />

        {/* 2. Animated Proven Performance Counters (Moved to top right after Hero to establish immediate trust) */}
        <RecordSection />

        {/* 3. Services, Sub-options & Portfolio Galleries */}
        <ServicesSection 
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          onOrderNow={handleOrderNow}
        />

        {/* 5. Dynamic Filterable Client Reviews */}
        <RatingsSection />

        {/* 6. Downloadable Resources Hub & search queries */}
        <ResourceHubSection />

        {/* 7. Team Members Grid & Corner Active Lights */}
        <TeamSection />

        {/* 8. Collapsible Common Accordion FAQs */}
        <FAQsSection />

        {/* 9. Contact Queries & Dual Timezone PKT Booking */}
        <ContactSection 
          preSelectedService={preSelectedService}
          preSelectedPortfolio={preSelectedPortfolio}
          setPreSelectedService={setPreSelectedService}
          setPreSelectedPortfolio={setPreSelectedPortfolio}
        />

      </main>

      {/* Corporate footer block */}
      <Footer onNavigate={handleNavigate} />

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            key="back-to-top"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-40 p-3.5 bg-japandi-soot text-japandi-linen rounded-full shadow-md hover:bg-japandi-earth transition-colors border border-japandi-border hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Back to Top"
            aria-label="Back to Top"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}
