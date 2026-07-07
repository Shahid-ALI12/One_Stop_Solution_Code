import { useState } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Briefcase, 
  Home, 
  HeartPulse, 
  Coffee,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Industry {
  id: string;
  name: string;
  icon: any;
  title: string;
  description: string;
  deliverables: string[];
  metric: string;
  metricLabel: string;
}

const INDUSTRIES: Industry[] = [
  {
    id: 'ecommerce',
    name: 'eCommerce & Retail',
    icon: ShoppingBag,
    title: 'Shopify, Amazon & Retail Financial Organization',
    description: 'Stop guessing your profit margins. We reconcile complex multi-currency bank feeds, automate tax categorization, track inventory assets, and construct clean sales-tax liabilities files across channels.',
    deliverables: [
      'Reconciliation of multi-currency Shopify / Amazon payouts',
      'Inventory cost-of-goods-sold (COGS) tracking models',
      'Multi-state Sales Tax liability reports'
    ],
    metric: '40%+',
    metricLabel: 'Reduction in tax preparation turnaround'
  },
  {
    id: 'saas',
    name: 'SaaS & Tech Startups',
    icon: TrendingUp,
    title: 'Venture & Cash-Flow Modeling for Tech Founders',
    description: 'Prepare for your next round with absolute ledger confidence. We build professional 15-slide investor pitch decks, configure dynamic operational forecasting sheets, and design automated Excel dashboards.',
    deliverables: [
      'Investor-ready PowerPoint slide deck masters',
      'Dynamic cash-flow forecasting & burn-rate sheets',
      'QuickBooks setup & chart of accounts structures'
    ],
    metric: '$1.8M+',
    metricLabel: 'Funding secured using our designed slides'
  },
  {
    id: 'professional',
    name: 'Professional Services & Legal',
    icon: Briefcase,
    title: 'Intake Automation & Operations for Professional Practices',
    description: 'Reclaim billable hours. We automate document workflows, format elegant Word templates, organize legal reports, compile client intake PDFs with Javascript calculations, and manage email calendars.',
    deliverables: [
      'Interactive calculative fillable PDF intake forms',
      'Bespoke Microsoft Word corporate branding templates',
      'Calendar management & inbox zero services'
    ],
    metric: '15 hrs',
    metricLabel: 'Saved per week by administrative outsourcing'
  },
  {
    id: 'realestate',
    name: 'Real Estate & Property',
    icon: Home,
    title: 'Financial Portfolios & Statements for Property Managers',
    description: 'We keep property books in perfect order. Our team handles tenant statement auditing, ledger reconciliations, real estate scheduling queues, and clean, formatted performance spreadsheets.',
    deliverables: [
      'Monthly lease ledger reconciliations',
      'Dynamic landlord performance trackers',
      'Administrative coordination & appointment setting'
    ],
    metric: '99.8%',
    metricLabel: 'Accuracy in historical tenant reconciliations'
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Wellness',
    icon: HeartPulse,
    title: 'Secure Document Handling & Internal Controls for Clinics',
    description: 'Navigate audit requirements seamlessly. We build robust Risk Control Matrices (RCM), compile strict SOP compliance files, format checklists, and manage offline client logs securely.',
    deliverables: [
      'Strict risk-control audit matrices (RCM)',
      'Clinical standard operating procedure (SOP) styling',
      'Secure, offline Microsoft Excel calculators'
    ],
    metric: '100%',
    metricLabel: 'Adherence to custom security standard audits'
  },
  {
    id: 'hospitality',
    name: 'Hospitality & Franchise',
    icon: Coffee,
    title: 'Daily Transaction Registries for Service Businesses',
    description: 'Keep multi-location operations synchronized. We interpret daily registers, organize payroll helpers, configure QuickBooks bank triggers, and design bespoke file structures.',
    deliverables: [
      'Daily sales register importing templates',
      'Structured multi-location performance sheets',
      'Simplified end-of-year reporting kits'
    ],
    metric: '5-Star',
    metricLabel: 'Rating across all retail audit clients'
  }
];

export default function IndustriesSection() {
  const [activeTab, setActiveTab] = useState<string>('ecommerce');

  const selectedIndustry = INDUSTRIES.find(ind => ind.id === activeTab) || INDUSTRIES[0];
  const IconComponent = selectedIndustry.icon;

  return (
    <section id="industries" className="py-24 bg-transparent border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest mb-2">Tailored Solutions</p>
          <h2 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-slate-900 mb-4">
            Custom Workflows for Your Industry
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed font-sans">
            Every sector operates under specific guidelines and reporting bounds. Our remote experts tailor ledger schemas, automated formulas, and document portfolios to fit your market standards perfectly.
          </p>
        </div>

        {/* Outer Tabs + Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Tab List Column */}
          <div className="lg:col-span-4 flex flex-col space-y-2.5 w-full">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2 px-3 block">
              Select Your Industry Segment:
            </span>
            <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:space-y-2">
              {INDUSTRIES.map((ind) => {
                const TabIcon = ind.icon;
                const isActive = ind.id === activeTab;
                return (
                  <button
                    key={ind.id}
                    onClick={() => setActiveTab(ind.id)}
                    className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl border text-left text-xs font-bold font-sans transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/10'
                        : 'bg-white/45 backdrop-blur-md text-slate-850 border-white/45 hover:bg-white/60 hover:text-indigo-600'
                    }`}
                  >
                    <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{ind.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Display Panel Column */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="glass-panel rounded-3xl p-6 sm:p-10 shadow-lg flex flex-col justify-between min-h-[420px]"
              >
                <div>
                  {/* Top Badge Panel */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/45 mb-6 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-slate-900 text-lg leading-tight">
                          {selectedIndustry.name}
                        </h3>
                        <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                          Operational Blueprint
                        </p>
                      </div>
                    </div>

                    {/* Metric Block */}
                    <div className="flex items-center space-x-3 bg-white/45 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/50 shrink-0 shadow-sm">
                      <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 leading-none">
                        {selectedIndustry.metric}
                      </div>
                      <div className="text-left max-w-[120px] leading-tight text-[10px] font-bold text-slate-500 font-sans uppercase">
                        {selectedIndustry.metricLabel}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-sans tracking-tight mb-2">
                        {selectedIndustry.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">
                        {selectedIndustry.description}
                      </p>
                    </div>

                    {/* Checklist */}
                    <div>
                      <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Key Specialist Deliverables
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedIndustry.deliverables.map((del, idx) => (
                          <div 
                            key={idx}
                            className="flex items-start space-x-2.5 bg-white/35 backdrop-blur-md p-3 rounded-xl border border-white/45 shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-[11px] font-medium text-slate-800 leading-normal font-sans">
                              {del}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower Action Row */}
                <div className="mt-8 pt-6 border-t border-white/45 flex items-center justify-between flex-wrap gap-4">
                  <p className="text-[11px] text-slate-500 font-sans">
                    💡 Custom NDA agreements are drafted for this industry segment.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const target = document.getElementById('contact');
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    <span>Request Custom Solution</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
