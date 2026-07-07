import { useState } from 'react';
import { RESOURCES } from '../data/mockData';
import { ResourceItem } from '../types';
import { Download, CheckCircle, Search, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ResourceHubSection() {
  const [downloadStates, setDownloadStates] = useState<{ [key: string]: 'idle' | 'preparing' | 'success' }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleDownload = (item: ResourceItem) => {
    // Set downloading state
    setDownloadStates(prev => ({ ...prev, [item.id]: 'preparing' }));

    // Simulate download finishing
    setTimeout(() => {
      setDownloadStates(prev => ({ ...prev, [item.id]: 'success' }));
      // Set back to idle after a few seconds
      setTimeout(() => {
        setDownloadStates(prev => ({ ...prev, [item.id]: 'idle' }));
      }, 4000);
    }, 1500);
  };

  const filteredResources = RESOURCES.filter(res =>
    res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <section id="resources" className="py-24 bg-transparent border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest mb-2">Resource Hub</p>
            <h2 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900 mb-2">
              Free Downloadable Guides & Templates
            </h2>
            <p className="text-sm text-slate-500 font-sans max-w-xl">
              Access helpful calculators, checklists, and Excel sheets prepared by our certified specialists to streamline your daily operations.
            </p>
          </div>

          {/* Search box */}
          <div className="relative shrink-0 w-full sm:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search resource files..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/45 border border-white/45 rounded-xl text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/35 backdrop-blur-md shadow-sm"
            />
          </div>
        </div>

        {/* Resources Cards Grid */}
        <div className="min-h-[250px]">
          <AnimatePresence mode="popLayout">
            {filteredResources.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredResources.map((item) => {
                  const status = downloadStates[item.id] || 'idle';
                  return (
                    <motion.div
                      layout
                      key={item.id}
                      id={`resource-card-${item.id}`}
                      variants={itemVariants}
                      whileHover={{ y: -3 }}
                      className="glass-card p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-500"
                    >
                      <div>
                        {/* Category Label */}
                        <span className="px-2.5 py-1 bg-white/45 text-slate-500 text-[10px] font-bold font-mono uppercase rounded-lg inline-block mb-4 border border-white/45 shadow-sm">
                          {item.category}
                        </span>
                        
                        <h3 className="font-sans font-bold text-base text-slate-800 mb-2 leading-snug">
                          {item.title}
                        </h3>
                        
                        <p className="text-xs text-slate-500 leading-relaxed font-sans mb-6">
                          {item.description}
                        </p>
                      </div>

                      {/* Footer Stats & Button */}
                      <div className="pt-4 border-t border-white/40 flex items-center justify-between">
                        <div className="text-[10px] font-mono text-slate-500">
                          <span className="block font-bold text-slate-800">{item.fileType}</span>
                          <span className="block mt-0.5">{item.fileSize} • {item.downloadCount + (status === 'success' ? 1 : 0)} DLs</span>
                        </div>

                        <motion.button
                          layout
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleDownload(item)}
                          disabled={status !== 'idle'}
                          className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all duration-300 flex items-center space-x-1.5 cursor-pointer ${
                            status === 'preparing'
                              ? 'bg-white/40 text-slate-405 border-white/45 cursor-not-allowed'
                              : status === 'success'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-150 cursor-default'
                              : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-600 text-indigo-600 hover:text-white shadow-sm'
                          }`}
                        >
                          {status === 'preparing' && (
                            <>
                              <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              <span>Preparing...</span>
                            </>
                          )}
                          {status === 'success' && (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Downloaded ✓</span>
                            </>
                          )}
                          {status === 'idle' && (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Free Download</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 bg-white/20 rounded-2xl border border-dashed border-white/45"
              >
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No matching files found. Try searching for "checklist" or "sheet".</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Suggestion notice */}
        <div className="mt-12 p-5 glass-panel rounded-2xl border border-white/45 flex items-center justify-between flex-col sm:flex-row gap-4 shadow-sm">
          <p className="text-xs text-slate-700 font-sans leading-relaxed">
            💡 <strong>Need a custom template designed?</strong> We construct bespoke automated sheets, checklists, and structured files formatted exactly for your business operations.
          </p>
          <button
            type="button"
            onClick={() => {
              const target = document.getElementById('contact');
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 shrink-0 font-bold cursor-pointer transition-all underline"
          >
            Request Custom File ➔
          </button>
        </div>

      </div>
    </section>
  );
}
