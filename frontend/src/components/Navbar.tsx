import { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  Shield, 
  Sparkles, 
  ChevronDown, 
  BookOpen, 
  Calculator, 
  FileSpreadsheet, 
  ShieldAlert, 
  UserCheck, 
  FileText,
  ArrowRight,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onSelectService?: (serviceId: string) => void;
  onLogoDoubleClick?: () => void;
}

export default function Navbar({ activeSection, onNavigate, onSelectService, onLogoDoubleClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const megaMenuTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock document scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = [
    { id: 'records', label: 'Proven Record' },
    { id: 'services', label: 'Services', hasDropdown: true },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'ratings', label: 'Reviews' },
    { id: 'resources', label: 'Resources' },
    { id: 'team', label: 'Our Team' },
    { id: 'faqs', label: 'FAQs' },
    { id: 'contact', label: 'Contact' }
  ];

  const megaServices = [
    {
      id: 'accounting',
      name: 'Accounting Services',
      desc: 'GAAP compliance, financial audits & custom reports',
      icon: Calculator,
      color: 'text-indigo-600 bg-indigo-50 border-white/40'
    },
    {
      id: 'bookkeeping',
      name: 'Meticulous Bookkeeping',
      desc: 'QBO setup, transaction reconciliations & backlogs',
      icon: BookOpen,
      color: 'text-emerald-600 bg-emerald-50 border-white/40'
    },
    {
      id: 'msoffice',
      name: 'MS Office Automation',
      desc: 'Advanced macro models, Excel formulas & pitch decks',
      icon: FileSpreadsheet,
      color: 'text-blue-600 bg-blue-50 border-white/40'
    },
    {
      id: 'internalaudit',
      name: 'Internal Audit',
      desc: 'Risk Matrices, operational audits & policy reviews',
      icon: ShieldAlert,
      color: 'text-slate-700 bg-slate-100 border-white/40'
    },
    {
      id: 'virtualassistant',
      name: 'Virtual Assistance',
      desc: 'High-volume calendars, emails & customer service',
      icon: UserCheck,
      color: 'text-purple-600 bg-purple-50 border-white/40'
    },
    {
      id: 'pdfs',
      name: 'PDF Documents & Forms',
      desc: 'Interactive calculative fillable PDF forms & OCR',
      icon: FileText,
      color: 'text-rose-600 bg-rose-50 border-white/40'
    },
    {
      id: 'yourservices',
      name: 'Web Development',
      desc: 'Custom responsive web apps, SaaS dashboards & portals',
      icon: Code,
      color: 'text-sky-600 bg-sky-50 border-white/40'
    }
  ];

  const handleItemClick = (id: string) => {
    const wasOpen = isOpen;
    setIsOpen(false);
    setIsMegaOpen(false);
    if (wasOpen) {
      setTimeout(() => {
        onNavigate(id);
      }, 150);
    } else {
      onNavigate(id);
    }
  };

  const handleServiceClick = (serviceId: string) => {
    const wasOpen = isOpen;
    setIsMegaOpen(false);
    setIsOpen(false);
    if (onSelectService) {
      onSelectService(serviceId);
    }
    if (wasOpen) {
      setTimeout(() => {
        onNavigate('services');
      }, 150);
    } else {
      onNavigate('services');
    }
  };

  const handleMouseEnter = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    setIsMegaOpen(true);
  };

  const handleMouseLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setIsMegaOpen(false);
    }, 200); // Small grace period to prevent immediate closing
  };

  return (
    <nav
      id="main-navbar"
      className="fixed top-4 left-4 right-4 z-50 transition-all duration-300 max-w-7xl lg:mx-auto"
    >
      <div className={`transition-all duration-300 rounded-2xl border ${
        isScrolled
          ? 'bg-white/45 backdrop-blur-xl shadow-lg border-white/35 py-3 px-6 shadow-slate-900/5'
          : 'bg-white/30 backdrop-blur-md border-white/20 py-4 px-6'
      }`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            id="brand-logo"
            className="flex items-center space-x-2.5 cursor-pointer group select-none"
            onClick={() => handleItemClick('hero')}
            onDoubleClick={onLogoDoubleClick}
            title="Double-click to open Admin Portal"
          >
            <div className="bg-indigo-600 text-white p-2 rounded-xl transition-transform group-hover:scale-105 duration-500 shadow-md shadow-indigo-600/10">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-sans font-extrabold text-lg text-slate-900 tracking-tight block leading-none">
                OneStop
              </span>
              <span className="text-[10px] font-mono text-indigo-600 tracking-widest font-bold uppercase leading-none block mt-1.5">
                Online Services
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div id="desktop-menu" className="hidden lg:flex items-center space-x-1 relative">
            {navItems.map((item) => {
              if (item.hasDropdown) {
                return (
                  <div
                    key={item.id}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="relative py-1"
                  >
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer duration-300 ${
                        activeSection === item.id || isMegaOpen
                          ? 'text-indigo-600 bg-white/55 border border-white/25 shadow-sm'
                          : 'text-slate-600 hover:text-indigo-600 hover:bg-white/30'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMegaOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Mega Dropdown Panel */}
                    <AnimatePresence>
                      {isMegaOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute left-1/2 -translate-x-[35%] mt-3 w-[720px] bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden z-50 p-6 grid grid-cols-12 gap-6 shadow-slate-900/10"
                        >
                          {/* Services List (col-span-8) */}
                          <div className="col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2 pb-2 border-b border-slate-100">
                              <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest block">
                                Core Capabilities Catalog
                              </span>
                            </div>
                            
                            {megaServices.map((srv) => {
                              const ServiceIcon = srv.icon;
                              return (
                                <button
                                  key={srv.id}
                                  onClick={() => handleServiceClick(srv.id)}
                                  className="flex items-start space-x-3 p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 text-left transition-all cursor-pointer group/item duration-300"
                                >
                                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${srv.color}`}>
                                    <ServiceIcon className="w-4 h-4 group-hover/item:scale-105 transition-transform duration-300" />
                                  </div>
                                  <div>
                                    <h4 className="text-[11px] font-bold text-slate-800 font-sans tracking-tight">
                                      {srv.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-sans leading-tight mt-0.5">
                                      {srv.desc}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Promo CTA Banner (col-span-4) */}
                          <div className="col-span-4 bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between">
                            <div>
                              <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider mb-3 shadow-sm">
                                <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                                <span>Risk Free</span>
                              </div>
                              <h4 className="text-xs font-sans font-bold text-slate-800 tracking-tight leading-snug">
                                Speak with our Lead Strategist
                              </h4>
                              <p className="text-[10px] text-slate-500 font-sans leading-relaxed mt-2">
                                Map custom bookkeeping, document layouts, and auditing compliance schedules during a free 15-minute briefing session.
                              </p>
                            </div>

                            <button
                              onClick={() => handleItemClick('contact')}
                              className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] sm:text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-md shadow-indigo-600/10"
                            >
                              <span>Schedule Briefing</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer duration-300 ${
                    activeSection === item.id
                      ? 'text-indigo-600 bg-white/55 border border-white/25 shadow-sm'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-white/30'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            <button
              onClick={() => handleItemClick('contact')}
              className="ml-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Book Consultation</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div id="mobile-menu-toggle" className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-white/35 focus:outline-none cursor-pointer transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            id="mobile-menu-panel" 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="lg:hidden bg-white/70 backdrop-blur-xl border border-white/40 mt-2 rounded-2xl shadow-xl absolute top-full left-0 right-0 py-4 px-6 space-y-2 max-h-[85vh] overflow-y-auto overscroll-contain"
          >
            {navItems.map((item) => {
              if (item.hasDropdown) {
                return (
                  <div key={item.id} className="space-y-1.5 border-b border-white/35 pb-3 mb-2">
                    <span className="px-4 text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-widest block mb-1">
                      {item.label} Catalog
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {megaServices.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleServiceClick(sub.id)}
                            className="flex items-center space-x-3 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-white/45 text-left cursor-pointer transition-colors"
                          >
                            <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center shrink-0 border border-white/40">
                              <SubIcon className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <span>{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all block cursor-pointer ${
                    activeSection === item.id
                      ? 'text-indigo-600 bg-white/55 border border-white/25 shadow-sm'
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-white/35'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="pt-4 border-t border-white/35">
              <button
                onClick={() => handleItemClick('contact')}
                className="w-full py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                <Sparkles className="w-4 h-4" />
                <span>Book 15-Min Free Consultation</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
