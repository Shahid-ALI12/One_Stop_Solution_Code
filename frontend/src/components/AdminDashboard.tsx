import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Briefcase, 
  StarHalf, 
  BarChart3, 
  LogOut, 
  X, 
  Check, 
  Plus, 
  Trash2, 
  Eye, 
  PlusCircle, 
  CheckCircle, 
  AlertCircle,
  Clock,
  User,
  Shield,
  Star,
  Globe2
} from 'lucide-react';
import { Service, PortfolioItem, Enquiry, Consultation, Rating } from '../types';

interface AdminDashboardProps {
  services: Service[];
  ratings: Rating[];
  enquiries: Enquiry[];
  consultations: Consultation[];
  stats: { clients: number; orders: number; countries: number };
  onUpdateServices: (updated: Service[]) => void;
  onUpdateRatings: (updated: Rating[]) => void;
  onUpdateEnquiries: (updated: Enquiry[]) => void;
  onUpdateConsultations: (updated: Consultation[]) => void;
  onUpdateStats: (updated: { clients: number; orders: number; countries: number }) => void;
  onLogout: () => void;
}

type ActiveTab = 'enquiries' | 'services' | 'reviews' | 'analytics';

export default function AdminDashboard({
  services,
  ratings,
  enquiries,
  consultations,
  stats,
  onUpdateServices,
  onUpdateRatings,
  onUpdateEnquiries,
  onUpdateConsultations,
  onUpdateStats,
  onLogout
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('enquiries');
  
  // Page A: Enquiries Sub-tabs
  const [enquirySubTab, setEnquirySubTab] = useState<'queries' | 'consultations'>('queries');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  // Page B: Content Manager Forms
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    shortDesc: '',
    overallDescription: '',
    accentColor: '#4f46e5',
    imageAsset: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    iconName: 'Briefcase'
  });

  const [activeServiceForPortfolio, setActiveServiceForPortfolio] = useState<string | null>(null);
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    description: '',
    skillsString: '',
    mediaTitle: '',
    mediaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
  });

  // Page C: Reviews form
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    designation: '',
    company: '',
    comment: '',
    country: 'United States',
    ratingStars: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
  });

  // Page D: Analytics stats input
  const [statsInput, setStatsInput] = useState({
    clients: stats.clients.toString(),
    orders: stats.orders.toString(),
    countries: stats.countries.toString()
  });
  const [statsSuccess, setStatsSuccess] = useState(false);

  // Handle Answered Toggles
  const handleToggleEnquiry = (id: string) => {
    const updated = enquiries.map(e => e.id === id ? { ...e, isAnswered: !e.isAnswered } : e);
    onUpdateEnquiries(updated);
  };

  const handleToggleConsultation = (id: string) => {
    const updated = consultations.map(c => c.id === id ? { ...c, isAnswered: !c.isAnswered } : c);
    onUpdateConsultations(updated);
  };

  const handleDeleteEnquiry = (id: string) => {
    const updated = enquiries.filter(e => e.id !== id);
    onUpdateEnquiries(updated);
  };

  const handleDeleteConsultation = (id: string) => {
    const updated = consultations.filter(c => c.id !== id);
    onUpdateConsultations(updated);
  };

  // Create Service
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim() || !newService.shortDesc.trim()) return;

    const created: Service = {
      id: `srv-${Date.now()}`,
      name: newService.name,
      shortDesc: newService.shortDesc,
      overallDescription: newService.overallDescription || newService.shortDesc,
      accentColor: newService.accentColor,
      textColor: '#ffffff',
      tailwindColor: 'indigo',
      iconName: newService.iconName,
      subServices: [
        {
          id: `sub-${Date.now()}-1`,
          name: `${newService.name} Core Support`,
          accentColor: newService.accentColor,
          textColor: '#ffffff',
          tailwindColor: 'indigo',
          description: 'Meticulous day-to-day administrative and financial management operations.'
        }
      ],
      portfolio: []
    };

    onUpdateServices([...services, created]);
    setIsAddingService(false);
    setNewService({
      name: '',
      shortDesc: '',
      overallDescription: '',
      accentColor: '#4f46e5',
      imageAsset: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
      iconName: 'Briefcase'
    });
  };

  // Add Portfolio Item
  const handleAddPortfolio = (e: React.FormEvent, serviceId: string) => {
    e.preventDefault();
    if (!newPortfolio.title.trim() || !newPortfolio.description.trim()) return;

    const skills = newPortfolio.skillsString
      ? newPortfolio.skillsString.split(',').map(s => s.trim()).filter(Boolean)
      : ['General'];

    const newItem: PortfolioItem = {
      id: `port-${Date.now()}`,
      title: newPortfolio.title,
      description: newPortfolio.description,
      skills,
      mediaType: 'pdf',
      mediaTitle: newPortfolio.mediaTitle || 'Case_Study.pdf',
      mediaUrl: newPortfolio.mediaUrl,
      thumbnailUrl: newPortfolio.thumbnailUrl
    };

    const updated = services.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          portfolio: [...(s.portfolio || []), newItem]
        };
      }
      return s;
    });

    onUpdateServices(updated);
    setActiveServiceForPortfolio(null);
    setNewPortfolio({
      title: '',
      description: '',
      skillsString: '',
      mediaTitle: '',
      mediaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
    });
  };

  // Toggle Review Approval
  const handleToggleReviewApproval = (id: string) => {
    const updated = ratings.map(r => r.id === id ? { ...r, isApproved: !r.isApproved } : r);
    onUpdateRatings(updated);
  };

  // Create Review Manual
  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.comment.trim()) return;

    const created: Rating = {
      id: `rate-${Date.now()}`,
      serviceId: 'bookkeeping',
      name: newReview.name,
      designation: newReview.designation || 'Client',
      company: newReview.company || 'Upwork Partnership',
      comment: newReview.comment,
      country: newReview.country,
      ratingStars: newReview.ratingStars,
      isApproved: true,
      avatarUrl: newReview.avatarUrl
    };

    onUpdateRatings([created, ...ratings]);
    setIsAddingReview(false);
    setNewReview({
      name: '',
      designation: '',
      company: '',
      comment: '',
      country: 'United States',
      ratingStars: 5,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    });
  };

  const handleDeleteReview = (id: string) => {
    const updated = ratings.filter(r => r.id !== id);
    onUpdateRatings(updated);
  };

  // Save stats
  const handleSaveStats = (e: React.FormEvent) => {
    e.preventDefault();
    const clientsNum = parseInt(statsInput.clients) || 0;
    const ordersNum = parseInt(statsInput.orders) || 0;
    const countriesNum = parseInt(statsInput.countries) || 0;

    onUpdateStats({
      clients: clientsNum,
      orders: ordersNum,
      countries: countriesNum
    });

    setStatsSuccess(true);
    setTimeout(() => setStatsSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden font-sans">
      
      {/* Absolute background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Persistence Left Glass Sidebar */}
      <aside className="w-72 bg-slate-900/40 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col justify-between relative z-10 shrink-0">
        <div>
          {/* Admin Header Title */}
          <div className="flex items-center space-x-3 mb-10 pb-5 border-b border-white/5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-sans font-extrabold tracking-tight text-white leading-none">
                OneStop Admin
              </h2>
              <span className="text-[10px] font-mono text-indigo-400 font-bold tracking-widest uppercase block mt-1.5">
                Control Layer
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('enquiries')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all duration-300 ${
                activeTab === 'enquiries'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Enquiries & Bookings</span>
              {enquiries.filter(e => !e.isAnswered).length + consultations.filter(c => !c.isAnswered).length > 0 && (
                <span className="ml-auto bg-indigo-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {enquiries.filter(e => !e.isAnswered).length + consultations.filter(c => !c.isAnswered).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all duration-300 ${
                activeTab === 'services'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-4 h-4 text-sky-400" />
              <span>Content Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all duration-300 ${
                activeTab === 'reviews'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <StarHalf className="w-4 h-4 text-amber-400" />
              <span>Reviews Moderation</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all duration-300 ${
                activeTab === 'analytics'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Operational Statistics</span>
            </button>
          </nav>
        </div>

        {/* Footer Logout Option */}
        <div className="pt-6 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full px-4 py-3 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-900/35 border border-rose-500/10 hover:border-rose-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Panel</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Scroll Window */}
      <main className="flex-1 overflow-y-auto p-10 relative z-10">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-sans font-extrabold text-white">
              {activeTab === 'enquiries' && 'Enquiries & Briefings'}
              {activeTab === 'services' && 'Content Management Platform'}
              {activeTab === 'reviews' && 'Client Feedback Review Hub'}
              {activeTab === 'analytics' && 'Operational System Overrides'}
            </h1>
            <p className="text-xs text-slate-400 font-sans mt-1">
              {activeTab === 'enquiries' && 'Consolidated pipeline tracking of general email queries and dual-timezone bookings.'}
              {activeTab === 'services' && 'Update core service listings and add detailed real-time portfolio cases.'}
              {activeTab === 'reviews' && 'Moderate customer testimonials or import multi-platform stars directly.'}
              {activeTab === 'analytics' && 'Overwrite active metrics featured on the public website counters.'}
            </p>
          </div>

          {/* Quick System Indicators */}
          <div className="flex items-center space-x-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <span className="flex items-center text-[10px] font-mono text-emerald-400 font-bold uppercase gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              System Active
            </span>
            <span className="text-slate-500 font-mono text-[10px]">v1.4.2</span>
          </div>
        </header>

        {/* Content Pane Swapping inside AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="min-h-[400px]"
          >
            {/* ========================================================= */}
            {/* PAGE A: ENQUIRIES & BOOKINGS MANAGER */}
            {/* ========================================================= */}
            {activeTab === 'enquiries' && (
              <div className="space-y-6">
                {/* Switch sub-tabs */}
                <div className="flex space-x-2 bg-slate-900/60 p-1 rounded-xl border border-white/5 max-w-sm">
                  <button
                    onClick={() => setEnquirySubTab('queries')}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                      enquirySubTab === 'queries'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    General Queries ({enquiries.length})
                  </button>
                  <button
                    onClick={() => setEnquirySubTab('consultations')}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                      enquirySubTab === 'consultations'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    15-Min Briefings ({consultations.length})
                  </button>
                </div>

                {/* Sub-tab A1: General Enquiries list */}
                {enquirySubTab === 'queries' && (
                  <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Submitted Email Leads</span>
                      <span className="text-[10px] font-mono text-slate-400">Total: {enquiries.length} rows</span>
                    </div>

                    {enquiries.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-xs font-mono">
                        No general project queries have been submitted yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-950/50 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-white/5">
                              <th className="p-4">Status</th>
                              <th className="p-4">Client Name</th>
                              <th className="p-4">Contact Detail</th>
                              <th className="p-4">Service Category</th>
                              <th className="p-4">Timestamp (UTC)</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono text-xs text-slate-300">
                            {enquiries.map((enq) => (
                              <tr 
                                key={enq.id}
                                className={`hover:bg-white/2 transition-colors ${
                                  enq.isAnswered ? 'opacity-60 line-through text-slate-500' : ''
                                }`}
                              >
                                <td className="p-4">
                                  <label className="flex items-center cursor-pointer space-x-2">
                                    <input 
                                      type="checkbox"
                                      checked={enq.isAnswered}
                                      onChange={() => handleToggleEnquiry(enq.id)}
                                      className="rounded bg-slate-950 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                                    />
                                    <span className="text-[10px] uppercase font-bold text-slate-400">
                                      {enq.isAnswered ? 'Resolved' : 'Active'}
                                    </span>
                                  </label>
                                </td>
                                <td className="p-4 font-bold text-white">{enq.name}</td>
                                <td className="p-4 text-slate-400 text-[11px]">
                                  <span className="text-xs px-2 py-0.5 bg-slate-800 rounded-md border border-white/5 mr-2">
                                    {enq.contactMethod}
                                  </span>
                                  {enq.contactInfo}
                                </td>
                                <td className="p-4">
                                  <span className="text-xs text-indigo-400 font-sans font-bold">{enq.selectedService}</span>
                                </td>
                                <td className="p-4 text-[11px] text-slate-400">
                                  {new Date(enq.timestamp).toLocaleDateString()} {new Date(enq.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => setSelectedEnquiry(enq)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-400 hover:text-indigo-300 border border-white/5 transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="View Query Message"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEnquiry(enq.id)}
                                    className="p-1.5 hover:bg-rose-950/50 rounded-lg text-rose-400 hover:text-rose-300 border border-transparent hover:border-rose-500/25 transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="Delete Entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab A2: Briefing Bookings list */}
                {enquirySubTab === 'consultations' && (
                  <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">15-Min Calendar Bookings</span>
                      <span className="text-[10px] font-mono text-slate-400">Total: {consultations.length} items</span>
                    </div>

                    {consultations.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-xs font-mono">
                        No 15-minute consultations have been booked yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-950/50 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-white/5">
                              <th className="p-4">Status</th>
                              <th className="p-4">Client Name</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Visitor Local Date & Time</th>
                              <th className="p-4">Calculated PKT Schedule</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono text-xs text-slate-300">
                            {consultations.map((c) => (
                              <tr 
                                key={c.id}
                                className={`hover:bg-white/2 transition-colors ${
                                  c.isAnswered ? 'opacity-60 line-through text-slate-500' : ''
                                }`}
                              >
                                <td className="p-4">
                                  <label className="flex items-center cursor-pointer space-x-2">
                                    <input 
                                      type="checkbox"
                                      checked={c.isAnswered}
                                      onChange={() => handleToggleConsultation(c.id)}
                                      className="rounded bg-slate-950 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                                    />
                                    <span className="text-[10px] uppercase font-bold text-slate-400">
                                      {c.isAnswered ? 'Concluded' : 'Pending'}
                                    </span>
                                  </label>
                                </td>
                                <td className="p-4 font-bold text-white">
                                  {c.name}
                                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                                    from {c.country}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-400 text-[11px]">{c.email}</td>
                                <td className="p-4 text-[11px] text-white">
                                  <span className="px-2 py-0.5 bg-indigo-950/50 text-indigo-400 rounded border border-indigo-500/10 text-[10px] mr-1">
                                    {c.timezone}
                                  </span>
                                  {c.selectedDateTime}
                                </td>
                                <td className="p-4 text-[11px] text-emerald-400 font-bold">
                                  {c.pktTime}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => setSelectedConsultation(c)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-400 hover:text-indigo-300 border border-white/5 transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="View Booking Detail"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteConsultation(c.id)}
                                    className="p-1.5 hover:bg-rose-950/50 rounded-lg text-rose-400 hover:text-rose-300 border border-transparent hover:border-rose-500/25 transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="Delete Entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* PAGE B: CONTENT MANAGER (SERVICES & PORTFOLIOS) */}
            {/* ========================================================= */}
            {activeTab === 'services' && (
              <div className="space-y-8">
                {/* Header Action Button */}
                <div className="flex justify-between items-center bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                  <div>
                    <h3 className="text-sm font-sans font-bold text-white">Service Capabilities Catalog</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-1">Configure what services and case study cards show up in your public sections.</p>
                  </div>
                  {!isAddingService && (
                    <button
                      onClick={() => setIsAddingService(true)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Service</span>
                    </button>
                  )}
                </div>

                {/* Form: Add Service */}
                <AnimatePresence>
                  {isAddingService && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                      onSubmit={handleCreateService}
                      className="bg-slate-900/60 rounded-3xl p-6 border border-white/10 space-y-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">Add Global Service Category</span>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingService(false)}
                          className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Service Category Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Corporate Tax Minimization"
                            value={newService.name}
                            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Accent Color HEX</label>
                            <input 
                              type="text"
                              required
                              placeholder="#10b981"
                              value={newService.accentColor}
                              onChange={(e) => setNewService({ ...newService, accentColor: e.target.value })}
                              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Lucide Icon Name</label>
                            <input 
                              type="text"
                              required
                              placeholder="Calculator"
                              value={newService.iconName}
                              onChange={(e) => setNewService({ ...newService, iconName: e.target.value })}
                              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Short Summary Description</label>
                        <input 
                          type="text"
                          required
                          placeholder="Your high-level client-facing tagline description shown in listings."
                          value={newService.shortDesc}
                          onChange={(e) => setNewService({ ...newService, shortDesc: e.target.value })}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Extended Overall Description</label>
                        <textarea 
                          rows={2}
                          placeholder="Provide the comprehensive service overview shown when selected in details."
                          value={newService.overallDescription}
                          onChange={(e) => setNewService({ ...newService, overallDescription: e.target.value })}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={() => setIsAddingService(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white shadow"
                        >
                          Save Service
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Services Grid and Nested Portfolios */}
                <div className="space-y-6">
                  {services.map((srv) => (
                    <div 
                      key={srv.id}
                      className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden p-6 space-y-6"
                    >
                      {/* Service header metadata */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-4 border-b border-white/5">
                        <div className="flex items-start space-x-3.5">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-xs font-mono shrink-0"
                            style={{ backgroundColor: srv.accentColor }}
                          >
                            {srv.name.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-base font-sans font-bold text-white">{srv.name}</h4>
                            <p className="text-xs text-slate-400 leading-normal font-sans mt-1 max-w-2xl">{srv.shortDesc}</p>
                            <span className="inline-block text-[9px] font-mono font-bold uppercase text-indigo-400 bg-indigo-950/50 border border-indigo-500/15 rounded-md px-2 py-0.5 mt-2">
                              HEX Accent: {srv.accentColor}
                            </span>
                          </div>
                        </div>

                        {/* Inline button to add portfolio to this specific service */}
                        {activeServiceForPortfolio !== srv.id && (
                          <button
                            onClick={() => setActiveServiceForPortfolio(srv.id)}
                            className="sm:self-center px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg text-xs transition-all flex items-center space-x-1 border border-white/5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Case Study</span>
                          </button>
                        )}
                      </div>

                      {/* Nested add portfolio form */}
                      <AnimatePresence>
                        {activeServiceForPortfolio === srv.id && (
                          <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onSubmit={(e) => handleAddPortfolio(e, srv.id)}
                            className="bg-slate-950/40 border border-white/10 rounded-xl p-5 space-y-4 overflow-hidden"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
                                Create Portfolio Case Study for {srv.name}
                              </span>
                              <button 
                                type="button" 
                                onClick={() => setActiveServiceForPortfolio(null)}
                                className="text-slate-400 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Case Study Title</label>
                                <input 
                                  type="text"
                                  required
                                  placeholder="e.g. 3-Year QuickBooks Cleanup"
                                  value={newPortfolio.title}
                                  onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Skills Tags (comma-separated)</label>
                                <input 
                                  type="text"
                                  placeholder="VBA Macros, Financial Modeling, Excel"
                                  value={newPortfolio.skillsString}
                                  onChange={(e) => setNewPortfolio({ ...newPortfolio, skillsString: e.target.value })}
                                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Short Description</label>
                              <textarea 
                                rows={2}
                                required
                                placeholder="Highlight problem statement, approach, and actual dollar/hour savings."
                                value={newPortfolio.description}
                                onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                                className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Thumbnail Image Asset URL</label>
                                <input 
                                  type="text"
                                  value={newPortfolio.thumbnailUrl}
                                  onChange={(e) => setNewPortfolio({ ...newPortfolio, thumbnailUrl: e.target.value })}
                                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Document Filename</label>
                                <input 
                                  type="text"
                                  placeholder="Corporate_Financial_Statements_2025.pdf"
                                  value={newPortfolio.mediaTitle}
                                  onChange={(e) => setNewPortfolio({ ...newPortfolio, mediaTitle: e.target.value })}
                                  className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                              <button 
                                type="button" 
                                onClick={() => setActiveServiceForPortfolio(null)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300"
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit" 
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold text-white"
                              >
                                Add Case
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>

                      {/* Display Portfolio items */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block pl-1">
                          Current Active Case Studies ({srv.portfolio?.length || 0})
                        </span>

                        {!srv.portfolio || srv.portfolio.length === 0 ? (
                          <div className="text-xs font-mono text-slate-500 py-4 text-center bg-slate-950/20 rounded-xl border border-white/5">
                            No detailed case studies linked to this service category yet.
                          </div>
                        ) : (
                          <div className="overflow-hidden border border-white/5 rounded-xl bg-slate-950/20">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-900 border-b border-white/5 text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                                  <th className="p-3">Thumbnail</th>
                                  <th className="p-3">Case Title</th>
                                  <th className="p-3">Associated Skills</th>
                                  <th className="p-3">Summary Description</th>
                                  <th className="p-3 text-right">Delete</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-mono text-slate-300 text-[11px]">
                                {srv.portfolio.map((port) => (
                                  <tr key={port.id} className="hover:bg-white/2 transition-colors">
                                    <td className="p-3">
                                      <img 
                                        src={port.thumbnailUrl} 
                                        alt={port.title}
                                        className="w-10 h-7 rounded object-cover border border-white/10"
                                        referrerPolicy="no-referrer"
                                      />
                                    </td>
                                    <td className="p-3 font-sans font-bold text-white">{port.title}</td>
                                    <td className="p-3">
                                      <div className="flex flex-wrap gap-1 max-w-xs">
                                        {port.skills.map((sk, index) => (
                                          <span 
                                            key={index}
                                            className="text-[9px] font-mono uppercase bg-slate-800 text-slate-400 border border-white/5 rounded-md px-1.5 py-0.5"
                                          >
                                            {sk}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3 font-sans max-w-sm truncate text-slate-400">
                                      {port.description}
                                    </td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => {
                                          const updatedPort = srv.portfolio?.filter(p => p.id !== port.id) || [];
                                          const updatedServices = services.map(s => s.id === srv.id ? { ...s, portfolio: updatedPort } : s);
                                          onUpdateServices(updatedServices);
                                        }}
                                        className="p-1 hover:bg-rose-950 text-rose-400 hover:text-rose-300 rounded border border-transparent hover:border-rose-500/10 transition-all inline-flex items-center justify-center"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* PAGE C: CLIENT FEEDBACK REVIEW HUB (RATINGS) */}
            {/* ========================================================= */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Header Action Card */}
                <div className="flex justify-between items-center bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                  <div>
                    <h3 className="text-sm font-sans font-bold text-white">Client Reviews Management Hub</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-1">Moderate existing reviews or manually import positive feedback from freelance marketplaces.</p>
                  </div>
                  {!isAddingReview && (
                    <button
                      onClick={() => setIsAddingReview(true)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Import Manual Review</span>
                    </button>
                  )}
                </div>

                {/* Form: Add Manual Review */}
                <AnimatePresence>
                  {isAddingReview && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleCreateReview}
                      className="bg-slate-900/60 rounded-3xl p-6 border border-white/10 space-y-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Import Client Review Card</span>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingReview(false)}
                          className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Client Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="Eleanor Vance"
                            value={newReview.name}
                            onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-sans"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Designation / Role</label>
                          <input 
                            type="text"
                            placeholder="CEO / Managing Director"
                            value={newReview.designation}
                            onChange={(e) => setNewReview({ ...newReview, designation: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-sans"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Company Name</label>
                          <input 
                            type="text"
                            placeholder="Lumina Retail"
                            value={newReview.company}
                            onChange={(e) => setNewReview({ ...newReview, company: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Country Location</label>
                          <input 
                            type="text"
                            required
                            placeholder="United States"
                            value={newReview.country}
                            onChange={(e) => setNewReview({ ...newReview, country: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-sans"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Rating Stars (1 - 5)</label>
                          <select 
                            value={newReview.ratingStars}
                            onChange={(e) => setNewReview({ ...newReview, ratingStars: parseInt(e.target.value) || 5 })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                          >
                            <option value={5}>5 Stars - Outstanding</option>
                            <option value={4}>4 Stars - Great</option>
                            <option value={3}>3 Stars - Average</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Avatar Image URL</label>
                          <input 
                            type="text"
                            value={newReview.avatarUrl}
                            onChange={(e) => setNewReview({ ...newReview, avatarUrl: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Review Feedback Comment</label>
                        <textarea 
                          rows={3}
                          required
                          placeholder="Paste client testimonial text content verbatim here..."
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-sans"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={() => setIsAddingReview(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white shadow"
                        >
                          Publish Review
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Ratings Table & Moderation List */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Testimonials Moderation Pipeline</span>
                    <span className="text-[10px] font-mono text-slate-400">Total: {ratings.length} testifiers</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/50 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-white/5">
                          <th className="p-4">Approval Status</th>
                          <th className="p-4">Client Detail</th>
                          <th className="p-4">Geographic Market</th>
                          <th className="p-4">Testimonial Comment</th>
                          <th className="p-4">Stars</th>
                          <th className="p-4 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-xs text-slate-300">
                        {ratings.map((rate) => (
                          <tr key={rate.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-4">
                              <label className="flex items-center cursor-pointer space-x-3 select-none">
                                <div className="relative">
                                  <input 
                                    type="checkbox"
                                    checked={rate.isApproved !== false}
                                    onChange={() => handleToggleReviewApproval(rate.id)}
                                    className="sr-only"
                                  />
                                  <div className={`w-10 h-5 rounded-full transition-colors ${rate.isApproved !== false ? 'bg-indigo-600' : 'bg-slate-800 border border-white/10'}`} />
                                  <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${rate.isApproved !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-[10px] font-bold ${rate.isApproved !== false ? 'text-indigo-400' : 'text-slate-500'}`}>
                                  {rate.isApproved !== false ? 'PUBLISHED' : 'HIDDEN'}
                                </span>
                              </label>
                            </td>
                            <td className="p-4 flex items-center space-x-3">
                              <img 
                                src={rate.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'} 
                                alt={rate.name}
                                className="w-9 h-9 rounded-full object-cover border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold text-white block">{rate.name}</span>
                                <span className="text-[10px] text-slate-400 block">{rate.designation}, {rate.company}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-400">{rate.country}</td>
                            <td className="p-4 font-sans text-xs italic text-slate-305 leading-relaxed max-w-sm truncate" title={rate.comment}>
                              "{rate.comment}"
                            </td>
                            <td className="p-4 text-amber-500">
                              <div className="flex items-center space-x-0.5">
                                {[...Array(rate.ratingStars || 5)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-current" />
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteReview(rate.id)}
                                className="p-1.5 hover:bg-rose-950/50 rounded-lg text-rose-400 hover:text-rose-300 border border-transparent hover:border-rose-500/25 transition-all inline-flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* PAGE D: ANALYTICS & OPERATIONAL RECORD BOARD */}
            {/* ========================================================= */}
            {activeTab === 'analytics' && (
              <div className="max-w-2xl bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-8 space-y-6">
                <div>
                  <h3 className="text-base font-sans font-bold text-white flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    <span>Real-Time Counter Configuration</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-1">
                    Overriding these values will instantly update the counts that animate in the live 'Our Proven Record' section for public users.
                  </p>
                </div>

                <form onSubmit={handleSaveStats} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Active Global Clients</label>
                      <input 
                        type="number"
                        required
                        placeholder="140"
                        value={statsInput.clients}
                        onChange={(e) => setStatsInput({ ...statsInput, clients: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                      <span className="text-[9px] text-slate-500 font-mono">baseline: 140+</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Completed Contracts</label>
                      <input 
                        type="number"
                        required
                        placeholder="380"
                        value={statsInput.orders}
                        onChange={(e) => setStatsInput({ ...statsInput, orders: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                      <span className="text-[9px] text-slate-500 font-mono">baseline: 380+</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Countries Serviced</label>
                      <input 
                        type="number"
                        required
                        placeholder="18"
                        value={statsInput.countries}
                        onChange={(e) => setStatsInput({ ...statsInput, countries: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                      <span className="text-[9px] text-slate-500 font-mono">baseline: 18+</span>
                    </div>
                  </div>

                  {statsSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2 font-mono"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Operational records updated and compiled! Baseline state synchronized.</span>
                    </motion.div>
                  )}

                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      Apply Overwrites
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MODAL 1: General Query Details */}
      <AnimatePresence>
        {selectedEnquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEnquiry(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                  General Project Query Payload
                </span>
                <button 
                  onClick={() => setSelectedEnquiry(null)}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3.5 bg-slate-950/50 p-3.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Client Name</span>
                    <span className="text-white font-sans font-bold text-sm mt-0.5 block">{selectedEnquiry.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Contact Method</span>
                    <span className="text-indigo-400 font-bold mt-0.5 block">{selectedEnquiry.contactInfo} ({selectedEnquiry.contactMethod})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Inquiry Subject</span>
                  <p className="text-white bg-slate-950/30 p-2.5 rounded-lg border border-white/5 font-sans font-semibold">
                    {selectedEnquiry.subject}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Complete Message Details</span>
                  <p className="text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-white/5 leading-relaxed font-sans text-xs max-h-60 overflow-y-auto">
                    {selectedEnquiry.message}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2">
                  <span>ID: {selectedEnquiry.id}</span>
                  <span>Received: {new Date(selectedEnquiry.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end space-x-2">
                {!selectedEnquiry.isAnswered && (
                  <button 
                    onClick={() => {
                      handleToggleEnquiry(selectedEnquiry.id);
                      setSelectedEnquiry(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white"
                  >
                    Mark Resolved
                  </button>
                )}
                <button 
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Booking Details */}
      <AnimatePresence>
        {selectedConsultation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedConsultation(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  15-Min Meeting Booking payload
                </span>
                <button 
                  onClick={() => setSelectedConsultation(null)}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3.5 bg-slate-950/50 p-3.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Client Name</span>
                    <span className="text-white font-sans font-bold text-sm mt-0.5 block">{selectedConsultation.name}</span>
                    <span className="text-[10px] text-slate-400">from {selectedConsultation.country}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Email Address</span>
                    <span className="text-indigo-400 font-bold mt-0.5 block">{selectedConsultation.email}</span>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Client Local Schedule
                    </span>
                    <p className="text-white text-xs mt-1 font-bold pl-4.5">
                      {selectedConsultation.selectedDateTime} ({selectedConsultation.timezone})
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      Calculated PKT Operational Slot
                    </span>
                    <p className="text-emerald-400 text-xs mt-1 font-bold pl-4.5">
                      {selectedConsultation.pktTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2">
                  <span>ID: {selectedConsultation.id}</span>
                  <span>Created: {new Date(selectedConsultation.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end space-x-2">
                {!selectedConsultation.isAnswered && (
                  <button 
                    onClick={() => {
                      handleToggleConsultation(selectedConsultation.id);
                      setSelectedConsultation(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white"
                  >
                    Conclude Briefing
                  </button>
                )}
                <button 
                  onClick={() => setSelectedConsultation(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
