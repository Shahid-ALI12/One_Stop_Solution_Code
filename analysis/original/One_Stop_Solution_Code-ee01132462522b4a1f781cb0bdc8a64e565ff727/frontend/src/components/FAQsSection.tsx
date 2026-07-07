import { useState } from 'react';
import { FAQS } from '../data/mockData';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FAQsSection() {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

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
      id="faqs"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeUpVariants}
      className="py-24 bg-transparent border-b border-white/20"
    >
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest mb-2">Common Questions</p>
          <h2 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500 font-sans">
            Got questions about file formats, timezones, secure bookkeeping procedures, or NDAs? Read our direct answers below.
          </p>
        </div>

        {/* FAQs Accordion Block */}
        <div className="space-y-4">
          {FAQS.map((item) => {
            const isOpen = openFaqId === item.id;
            return (
              <div
                key={item.id}
                id={`faq-item-${item.id}`}
                className={`bg-white/35 backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${
                  isOpen ? 'border-indigo-500/40 bg-white/50 ring-1 ring-indigo-500/10' : 'border-white/45'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(item.id)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer hover:bg-white/40 duration-350"
                >
                  <span className="font-sans font-bold text-sm sm:text-base text-slate-800 pr-4 flex items-center space-x-3">
                    <HelpCircle className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                    <span>{item.question}</span>
                  </span>
                  <span className="text-slate-500 shrink-0">
                    {isOpen ? (
                      <ChevronUp className="w-4.5 h-4.5 text-indigo-600" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5" />
                    )}
                  </span>
                </button>

                {/* Animated Answer box */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 border-t border-white/20 bg-white/10">
                        <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-sans font-semibold">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Support helper */}
        <div className="text-center mt-12">
          <p className="text-xs text-slate-500 font-sans">
            Still have an unanswered question about custom accounting or virtual assistant hours?
          </p>
          <button
            type="button"
            onClick={() => {
              const target = document.getElementById('contact');
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold font-sans underline mt-2 block cursor-pointer"
          >
            Submit a direct query or write us on WhatsApp ➔
          </button>
        </div>

      </div>
    </motion.section>
  );
}
