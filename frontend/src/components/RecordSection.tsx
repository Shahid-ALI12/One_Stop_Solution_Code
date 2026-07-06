import { useEffect, useState, useRef } from 'react';
import { Users, ClipboardList, Globe2, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface RecordSectionProps {
  initialClients?: number;
  initialOrders?: number;
  initialCountries?: number;
}

export default function RecordSection({
  initialClients = 140,
  initialOrders = 380,
  initialCountries = 18
}: RecordSectionProps) {
  const [clients, setClients] = useState(0);
  const [orders, setOrders] = useState(0);
  const [countries, setCountries] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const sectionRef = useRef<HTMLElement>(null);

  // Sync state if props change after initial animation
  useEffect(() => {
    if (hasAnimated) {
      setClients(initialClients);
      setOrders(initialOrders);
      setCountries(initialCountries);
    }
  }, [initialClients, initialOrders, initialCountries, hasAnimated]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          // Define targets
          const targetClients = initialClients;
          const targetOrders = initialOrders;
          const targetCountries = initialCountries;

          // Durations and step intervals
          const duration = 1600; // 1.6 seconds animation
          const steps = 40;
          const stepTime = duration / steps;

          let currentStep = 0;

          const interval = setInterval(() => {
            currentStep++;
            
            setClients(Math.floor((targetClients / steps) * currentStep));
            setOrders(Math.floor((targetOrders / steps) * currentStep));
            setCountries(Math.floor((targetCountries / steps) * currentStep));

            if (currentStep >= steps) {
              setClients(targetClients);
              setOrders(targetOrders);
              setCountries(targetCountries);
              clearInterval(interval);
            }
          }, stepTime);

          // Once triggered, stop observing
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated]);

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.section
      ref={sectionRef}
      id="records"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeUpVariants}
      className="py-24 bg-transparent border-b border-white/20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        
        {/* Core title panel */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest mb-2">Our Proven Record</p>
          <h2 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-slate-900 mb-4">
            Reliable Remote Performance Scales
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed font-sans">
            We hold ourselves to transparent, meticulous standards. Over years of focused practice, we have supported international startups, founders, and private clinics with clean operations.
          </p>
        </div>

        {/* Counter Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-6 lg:gap-8">
          
          {/* Card: Clients */}
          <div className="glass-card p-2 sm:p-6 text-center hover:border-indigo-500/40 transition-all duration-500 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-50 border border-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-2 sm:mb-4 shadow-sm">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold text-slate-900 mb-0.5 sm:mb-1.5">
                {clients}+
              </div>
              <h3 className="text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-tight sm:tracking-widest text-indigo-600 leading-none">
                Clients
              </h3>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500 font-sans mt-1">
              Active long-term service relationships
            </p>
          </div>

          {/* Card: Orders */}
          <div className="glass-card p-2 sm:p-6 text-center hover:border-indigo-500/40 transition-all duration-500 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-50 border border-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-2 sm:mb-4 shadow-sm">
                <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold text-slate-900 mb-0.5 sm:mb-1.5">
                {orders}+
              </div>
              <h3 className="text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-tight sm:tracking-widest text-indigo-600 leading-none">
                Contracts
              </h3>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500 font-sans mt-1">
              Individual assignments closed
            </p>
          </div>

          {/* Card: Countries */}
          <div className="glass-card p-2 sm:p-6 text-center hover:border-indigo-500/40 transition-all duration-500 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-50 border border-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-2 sm:mb-4 shadow-sm">
                <Globe2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold text-slate-900 mb-0.5 sm:mb-1.5">
                {countries}+
              </div>
              <h3 className="text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-tight sm:tracking-widest text-indigo-600 leading-none">
                Countries
              </h3>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500 font-sans mt-1">
              Serving US, UK, Australia, Europe & UAE
            </p>
          </div>

          {/* Card: Quality Rating */}
          <div className="glass-card p-2 sm:p-6 text-center hover:border-indigo-500/40 transition-all duration-500 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-50 border border-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-2 sm:mb-4 shadow-sm">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold text-slate-900 mb-0.5 sm:mb-1.5">
                100%
              </div>
              <h3 className="text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-tight sm:tracking-widest text-indigo-600 leading-none">
                Success
              </h3>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500 font-sans mt-1">
              Maintained across major platforms
            </p>
          </div>

        </div>

      </div>
    </motion.section>
  );
}
