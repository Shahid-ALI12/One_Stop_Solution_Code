import { Service, Rating, TeamMember, ResourceItem, FAQItem } from '../types';

export interface PortfolioItem {
  title: string;
  description: string;
  skills: string[];
  mediaUrl: string;
}

export interface DetailedService {
  id: string;
  heading: string;
  summary: string;
  imageAsset: string;
  extendedDetails: string[];
  portfolio: PortfolioItem[];
}

export const servicesData: DetailedService[] = [
  {
    id: "bookkeeping-accounting",
    heading: "Bookkeeping & Accounting",
    summary: "Your numbers are always up-to-date. With weekly bookkeeping, your accountant ensures accurate financials and timely monthly reports.",
    imageAsset: "https://xendoo.com/wp-content/uploads/2025/03/Accounting-Bookkeeping-Accordion.webp",
    extendedDetails: [
      "Weekly transaction categorization & multi-bank ledger reconciliation",
      "Monthly Profit & Loss, Balance Sheet, and Statement of Cash Flows generation",
      "Accounts Receivable/Payable matching & custom chart of accounts configuration"
    ],
    portfolio: [
      {
        title: "E-Commerce Financial Reconstruction",
        description: "Reconciled 6 months of messy, high-volume Stripe and Shopify payouts with QuickBooks Online.",
        skills: ["QuickBooks Online", "Shopify", "Data Reconciliation"],
        mediaUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
      }
    ]
  },
  {
    id: "catch-up-bookkeeping",
    heading: "Catch-Up Bookkeeping",
    summary: "Behind on your books? We’ve got you covered. Your books will be updated accurately, bringing financial clarity and confidence.",
    imageAsset: "https://xendoo.com/wp-content/uploads/2025/03/Behind-in-your-Books.webp",
    extendedDetails: [
      "Forensic look-back through historical unorganized accounts and missing receipts",
      "Historical cleanup and bank statement matching going back up to 3 fiscal years",
      "Tax-ready trial balance closing with clean documentation for auditors"
    ],
    portfolio: [
      {
        title: "3-Year Clean-up for Venture-Backed Startup",
        description: "Sorted out over $500k in historical untracked SaaS expenses and closed books for clean audits.",
        skills: ["Excel Data Analysis", "Ledger Cleanup", "Audit Preparation"],
        mediaUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800"
      }
    ]
  },
  {
    id: "tax-services",
    heading: "Tax Services",
    summary: "Year-round tax support from expert advisors, dedicated to maximizing your tax savings and keeping your business compliant.",
    imageAsset: "https://xendoo.com/wp-content/uploads/2025/03/Tax-Accordion.webp",
    extendedDetails: [
      "Strategic corporate and individual tax planning, advisory, and structure setups",
      "Maximizing localized deductions and discovering niche industry tax credits",
      "Comprehensive end-of-year corporate tax filing and strict regulatory compliance"
    ],
    portfolio: [
      {
        title: "Small Business Corporate Tax Minimization",
        description: "Restructured asset depreciation profiles, legally reducing year-end tax liability by 15%.",
        skills: ["Corporate Tax Strategy", "Compliance", "Tax Deductions"],
        mediaUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
      }
    ]
  }
];

export const SERVICES: Service[] = [
  {
    id: 'accounting',
    name: 'Accounting Services',
    shortDesc: 'Comprehensive accounting, tax preparation readiness, and corporate financial statements.',
    overallDescription: 'Our professional accounting services deliver precise, compliance-ready financial solutions for small and medium-sized businesses. We manage your end-to-end accounting processes, ensuring your records are audit-ready, tax-compliant, and perfectly organized to guide executive decision-making.',
    accentColor: '#4f46e5', // Indigo
    textColor: '#ffffff',
    tailwindColor: 'indigo',
    iconName: 'Calculator',
    portfolio: [
      {
        id: 'p-acc-1',
        title: 'End-of-Year Corporate Financial Reporting',
        skills: ['Financial Statements', 'Balance Sheets', 'Tax Readiness', 'GAAP Compliance'],
        description: 'Successfully prepared comprehensive year-end balance sheets, income statements, and cash flow statements for a multi-state distribution firm, resolving a $45k accounts discrepancy.',
        mediaType: 'pdf',
        mediaUrl: '/assets/sample_financial_report.pdf',
        mediaTitle: 'Corporate_Financial_Statements_2025.pdf',
        thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'p-acc-2',
        title: 'Monthly Trial Balance & Ledger Reconciliation',
        skills: ['Ledger Audit', 'Adjusting Entries', 'Amortization Schedules'],
        description: 'Established a monthly closing routine and adjusted ledger entries for a consulting agency with 35 active contractors, reducing tax filing preparation time by 60%.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200',
        thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  {
    id: 'bookkeeping',
    name: 'Bookkeeping',
    shortDesc: 'Organize your transactions and keep your accounts reconciled. Available in QuickBooks and Microsoft Excel.',
    overallDescription: 'Streamline your daily financial health with meticulous bookkeeping. We specialize in configuring real-time ledger entries, bank reconciliations, accounts payable/receivable tracking, and financial health reporting across leading systems.',
    accentColor: '#2ca01c', // QuickBooks Green
    textColor: '#ffffff',
    tailwindColor: 'emerald',
    iconName: 'BookOpen',
    subServices: [
      {
        id: 'bk-qb',
        name: 'QuickBooks Online',
        brandName: 'QuickBooks',
        accentColor: '#2ca01c',
        textColor: '#ffffff',
        tailwindColor: 'emerald',
        description: 'Authorized Setup, customized Chart of Accounts, bank feed automation, categorization, and monthly cleanups.'
      },
      {
        id: 'bk-excel',
        name: 'Microsoft Excel Bookkeeping',
        brandName: 'Excel Bookkeeping',
        accentColor: '#107c41', // Excel Green
        textColor: '#ffffff',
        tailwindColor: 'green',
        description: 'Tailor-made offline ledger models, automated receipts logging, and macro-enabled tax calculators.'
      }
    ],
    portfolio: [
      {
        id: 'p-bk-1',
        title: '3-Year QuickBooks Online Account Cleanup',
        skills: ['QuickBooks Online', 'Bank Feeds', 'Historical Reconciliation', 'Chart of Accounts'],
        description: 'Reconciled 36 months of un-categorized transactions, bank feeds, and duplicate accounts for a fast-growing US-based Shopify seller, ensuring flawless back-tax filing.',
        mediaType: 'pdf',
        mediaUrl: '/assets/quickbooks_cleanup_case_study.pdf',
        mediaTitle: 'QBO_Cleanup_Case_Study.pdf',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'p-bk-2',
        title: 'Custom Microsoft Excel Bookkeeping System',
        skills: ['VBA Macros', 'Pivot Charts', 'Receipts Ledger', 'Dynamic Dashboard'],
        description: 'Designed a fully custom, lightweight offline ledger for a local brick-and-mortar retail brand. Features automatic dashboard rendering and VAT calculation utilities.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  {
    id: 'msoffice',
    name: 'Microsoft Office',
    shortDesc: 'Expert level document engineering, custom spreadsheet formulas, and visual slideshow decks.',
    overallDescription: 'Enhance your workplace productivity and corporate presentation with executive-grade Microsoft Office support. We provide deep-level technical engineering in Word formatting, custom macro development in Excel, and professional investor deck design in PowerPoint.',
    accentColor: '#2b579a', // Word Blue
    textColor: '#ffffff',
    tailwindColor: 'blue',
    iconName: 'FileSpreadsheet',
    subServices: [
      {
        id: 'mo-word',
        name: 'Microsoft Word',
        brandName: 'Word',
        accentColor: '#2b579a',
        textColor: '#ffffff',
        tailwindColor: 'blue',
        description: 'Professional typography styling, structural styling guides, fillable fields, and legal document layouts.'
      },
      {
        id: 'mo-excel',
        name: 'Microsoft Excel',
        brandName: 'Excel',
        accentColor: '#107c41',
        textColor: '#ffffff',
        tailwindColor: 'green',
        description: 'Advanced dynamic formulas (XLOOKUP, LET, Lambda), Pivot Tables, Power Query, VBA automation, and custom sheets.'
      },
      {
        id: 'mo-ppt',
        name: 'Microsoft PowerPoint',
        brandName: 'PowerPoint',
        accentColor: '#d24726', // PPT Orange
        textColor: '#ffffff',
        tailwindColor: 'orange',
        description: 'Executive pitch deck visual formatting, custom infographic charts, and cohesive brand layout structures.'
      }
    ],
    portfolio: [
      {
        id: 'p-mo-1',
        title: 'Interactive Excel Business Forecast Model',
        skills: ['Excel Formulas', 'Power Query', 'Financial Forecasting', 'What-If Analysis'],
        description: 'Created a highly responsive operational forecasting tool incorporating scenario-selection, automatic currency conversion, and visual sales-funnel breakdowns.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&q=80&w=1200',
        thumbnailUrl: 'https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'p-mo-2',
        title: 'Tech Startup 15-Slide Investor Pitch Deck',
        skills: ['PowerPoint Design', 'Pitch Deck Coaching', 'SVG Infographics', 'Slide Master'],
        description: 'Designed and formatted an executive slide deck for a fintech startup, ensuring strict corporate branding guidelines. The presentation helped secure $1.8M in seed funding.',
        mediaType: 'pdf',
        mediaUrl: '/assets/sample_investor_deck.pdf',
        mediaTitle: 'Fintech_Seed_Round_Deck.pdf',
        thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  {
    id: 'internalaudit',
    name: 'Internal Audit',
    shortDesc: 'Risk management, internal control design, SOX compliance, and policy evaluations.',
    overallDescription: 'Shield your organization from hidden liabilities and operational inefficiencies. Our rigorous Internal Audit assessments examine your controls, evaluate policy adherence, and compile clear risk management matrix boards.',
    accentColor: '#0f172a', // Slate/Steel
    textColor: '#ffffff',
    tailwindColor: 'slate',
    iconName: 'ShieldAlert',
    portfolio: [
      {
        id: 'p-ia-1',
        title: 'SOP & Risk Control Matrix Construction',
        skills: ['Risk Assessment', 'Internal Controls', 'SOP Writing', 'SOX Framework'],
        description: 'Created an exhaustive risk-control matrix (RCM) evaluating the procurement cycle of a manufacturing enterprise, identifying 6 key control weaknesses and mitigating fraud risks.',
        mediaType: 'pdf',
        mediaUrl: '/assets/procurement_risk_rcm_sample.pdf',
        mediaTitle: 'Procurement_Risk_Matrix.pdf',
        thumbnailUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  {
    id: 'virtualassistant',
    name: 'Virtual Assistance & Admin Support',
    shortDesc: 'Efficient email management, calendar tracking, document digitization, and database entries.',
    overallDescription: 'Reclaim your valuable time by delegating repetitive administrative chores to our accurate Virtual Assistants. We handle high-volume email correspondence, coordinate calendar slots across international zones, and oversee daily data workflows.',
    accentColor: '#7c3aed', // Purple
    textColor: '#ffffff',
    tailwindColor: 'purple',
    iconName: 'UserCheck',
    portfolio: [
      {
        id: 'p-va-1',
        title: 'Executive Calendar & Email Pipeline Optimization',
        skills: ['Gmail Organization', 'Calendly Syncing', 'Customer Relations', 'Time Management'],
        description: 'Managed a real estate CEO’s high-traffic inbox (200+ emails/day), reducing response latency from 18 hours to under 45 minutes while scheduling 15+ weekly lead appointments.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1507207611509-ec012433ff52?auto=format&fit=crop&q=80&w=1200',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507207611509-ec012433ff52?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  {
    id: 'pdfs',
    name: 'PDF Documents & Forms',
    shortDesc: 'Interactive fillable PDF forms, calculations, electronic signatures, and secure document processing.',
    overallDescription: 'Upgrade your manual customer onboarding with smart PDF solutions. We build highly dynamic, calculative fillable PDF forms, embed electronic signature capabilities, perform advanced OCR text recoveries, and handle document sanitization.',
    accentColor: '#dc2626', // PDF Red
    textColor: '#ffffff',
    tailwindColor: 'red',
    iconName: 'FileText',
    portfolio: [
      {
        id: 'p-pdf-1',
        title: 'Calculative Fillable Client Onboarding Form',
        skills: ['Adobe Acrobat Pro', 'Form Calculations', 'JavaScript in PDF', 'E-Signatures'],
        description: 'Developed an elegant, secure interactive application form for an insurance broker with automated premiums estimators, mandatory input checks, and integrated signature lines.',
        mediaType: 'pdf',
        mediaUrl: '/assets/fillable_onboarding_form_sample.pdf',
        mediaTitle: 'Client_Interactive_Onboarding.pdf',
        thumbnailUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  {
    id: 'yourservices',
    name: 'Web Development',
    shortDesc: 'Custom responsive web applications, interactive SaaS dashboards, landing pages, and web systems.',
    overallDescription: 'We design and build clean, secure, and lightning-fast web experiences tailored to your business rules. Utilizing React, TypeScript, and modern styling libraries, we turn mockups and operational requirements into functional web systems with beautiful interactions and durable user workflows.',
    accentColor: '#0ea5e9', // Sky Blue
    textColor: '#ffffff',
    tailwindColor: 'sky',
    iconName: 'Code',
    portfolio: [
      {
        id: 'p-ys-1',
        title: 'Executive Financial & Analytics Dashboard Portal',
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Recharts API', 'Performance Optimization'],
        description: 'Designed and engineered an elite visual reporting panel and tracking web portal for operations managers. Includes clean visual graphs, responsive tables, CSV data exporters, and localized state caching, enabling a 50% faster auditing turn.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'p-ys-2',
        title: 'Interactive Client Intake & Task Automation Portal',
        skills: ['Full-Stack Web', 'Vite', 'Framer Motion', 'API Integration', 'Secure Forms'],
        description: 'Created a highly responsive business workflow application that automates user onboarding, processes document uploads via custom components, and tracks operational status in real-time, reducing client kickoff friction by 40%.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400'
      }
    ]
  }
];

export const RATINGS: Rating[] = [
  {
    id: 'r1',
    name: 'Alexander Thompson',
    designation: 'CEO & Founder',
    company: 'Apex Digital LLC',
    country: 'United States',
    serviceId: 'bookkeeping',
    rating: 5,
    comment: 'The 3-year bookkeeping cleanup was incredible. They sorted out all of our QuickBooks Online chaos, and the tax filing was entirely hassle-free. Absolutely recommended!'
  },
  {
    id: 'r2',
    name: 'Sarah Jenkins',
    designation: 'Operations Director',
    company: 'Vanguard Retail Systems',
    country: 'United Kingdom',
    serviceId: 'msoffice',
    rating: 5,
    comment: 'The Excel dynamic model they designed changed how we track inventory. Formulas are robust, the master macros save us 10 hours a week, and visual metrics are clear.'
  },
  {
    id: 'r3',
    name: 'Bilal Al-Mansoor',
    designation: 'Finance Partner',
    company: 'Oasis Trading Group',
    country: 'United Arab Emirates',
    serviceId: 'accounting',
    rating: 5,
    comment: 'Exceptional professionalism in preparing our corporate trial balance and cash flow statements. Everything is structured precisely according to international GAAP rules.'
  },
  {
    id: 'r4',
    name: 'Chloe Chevalier',
    designation: 'General Manager',
    company: 'Elysian Estates',
    country: 'France',
    serviceId: 'virtualassistant',
    rating: 5,
    comment: 'Our VA is fully proactive! Calendar coordination is flawless and client messages are handled with utmost courtesy. Highly organized and always online.'
  },
  {
    id: 'r5',
    name: 'Jonathan Miller',
    designation: 'Head of Audit Committee',
    company: 'Apex Logistics Inc.',
    country: 'Canada',
    serviceId: 'internalaudit',
    rating: 5,
    comment: 'They highlighted severe control risks in our procurement chain that we completely overlooked. The SOX assessment and risk control matrix was of institutional grade.'
  },
  {
    id: 'r6',
    name: 'Elena Rostova',
    designation: 'Legal Counsel',
    company: 'Rostov & Partners',
    country: 'Germany',
    serviceId: 'pdfs',
    rating: 5,
    comment: 'Created highly sophisticated fillable PDF contract templates. Interactive electronic signature fields and calculation elements function beautifully across devices.'
  },
  {
    id: 'r7',
    name: 'Devon Carter',
    designation: 'Owner',
    company: 'Elevate Consulting',
    country: 'Australia',
    serviceId: 'bookkeeping',
    rating: 5,
    comment: 'The custom Excel bookkeeping sheet they build is light, fast, and does exactly what we need without expensive software subscriptions. Flawless execution.'
  }
];

export const TEAM: TeamMember[] = [
  {
    id: 'tm1',
    name: 'Muhammad Farhan',
    title: 'Lead Accounting Specialist & Certified ProAdvisor',
    pictureUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    experience: '8+ Years',
    isOnline: true,
    certifications: [
      'Intuit QuickBooks Certified ProAdvisor',
      'Advanced Certified Bookkeeper',
      'Xero Certified Advisor'
    ]
  },
  {
    id: 'tm2',
    name: 'Sidra Amin',
    title: 'Senior Microsoft Office Architect & Admin Lead',
    pictureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    experience: '6+ Years',
    isOnline: true,
    certifications: [
      'Microsoft Office Specialist (MOS) Excel Expert',
      'Adobe Acrobat Certified Professional',
      'Certified Virtual Assistant (CVA)'
    ]
  },
  {
    id: 'tm3',
    name: 'Tariq Mehmood',
    title: 'Internal Audit Director & Risk Consultant',
    pictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    experience: '10+ Years',
    isOnline: false,
    certifications: [
      'Certified Internal Auditor (CIA)',
      'Association of Chartered Certified Accountants (ACCA)',
      'SOX Compliance Specialist'
    ]
  }
];

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I book a free 15-minute consultation?',
    answer: 'Simply scroll to our Consultation Booking form, select your preferred date, time, and country. Our system automatically processes your timezone, aligns it with Pakistan Standard Time, and sends an invite. There is absolutely no charge.'
  },
  {
    id: 'faq-2',
    question: 'What platforms can I make payments through?',
    answer: 'We support multiple payment channels to suit your business workflows. You can work directly via our official profiles on Upwork and Fiverr, or settle secure invoices directly via standard Bank Transfer or major professional portals.'
  },
  {
    id: 'faq-3',
    question: 'Do you charge flat rates or hourly rates?',
    answer: 'We offer both options! For well-defined scopes (like accounting cleanups, setting up specific ledgers, template formatting, or RCM creation), we establish transparent flat rates. For continuous administrative virtual assistance, we provide flexible hourly packages.'
  },
  {
    id: 'faq-4',
    question: 'Is my financial data kept confidential?',
    answer: 'Absolutely. Client confidentiality is our top operational priority. We are fully prepared to sign standard Non-Disclosure Agreements (NDAs) before inspecting your books or operations, and we use secure file sharing systems.'
  },
  {
    id: 'faq-5',
    question: 'How fast can you complete a QuickBooks cleanup?',
    answer: 'The turnaround depends on the volume of transactions and years of backlog, but standard cleanups typically take between 5 to 10 business days. We always provide a clear timeline after our initial review.'
  }
];

export const RESOURCES: ResourceItem[] = [
  {
    id: 'res-1',
    title: 'Small Business Bookkeeping Checklist',
    category: 'Bookkeeping',
    description: 'A step-by-step PDF manual detailing daily, weekly, and monthly reconciliation tasks to keep your ledger pristine.',
    fileSize: '1.4 MB',
    fileType: 'PDF Guide',
    downloadCount: 342
  },
  {
    id: 'res-2',
    title: 'Advanced Excel Formulas Master Cheat Sheet',
    category: 'Microsoft Office',
    description: 'A clean spreadsheet cheat sheet showcasing powerful dynamic array formulas, lookup templates, and formatting macros.',
    fileSize: '850 KB',
    fileType: 'XLSX Template',
    downloadCount: 512
  },
  {
    id: 'res-3',
    title: 'Internal Audit Readiness Checklist',
    category: 'Internal Audit',
    description: 'An executive list mapping out key internal control questions and items to review before external auditors arrive.',
    fileSize: '620 KB',
    fileType: 'PDF Checklist',
    downloadCount: 189
  }
];
