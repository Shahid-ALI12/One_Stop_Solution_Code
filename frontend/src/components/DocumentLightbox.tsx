import { X, ZoomIn, ZoomOut, Download, Printer, RotateCw, FileText, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface DocumentLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: 'image' | 'pdf' | 'video';
  mediaUrl: string;
  mediaTitle?: string;
  skills?: string[];
  description?: string;
}

export default function DocumentLightbox({
  isOpen,
  onClose,
  mediaType,
  mediaUrl,
  mediaTitle = 'document.pdf',
  skills = [],
  description = ''
}: DocumentLightboxProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [downloaded, setDownloaded] = useState(false);

  // Lock document scroll when document lightbox is open
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

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
    // Simulate file download
    const link = document.createElement('a');
    link.href = '#';
    link.setAttribute('download', mediaTitle);
    document.body.appendChild(link);
    // We don't trigger link.click() since it's mock, just show feedback
    document.body.removeChild(link);
  };

  return (
    <motion.div
      id="lightbox-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6"
    >
      {/* Lightbox Modal Box */}
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
      >
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 min-w-0">
            <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="text-sm font-bold tracking-tight font-mono truncate text-slate-200">
              {mediaTitle}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {mediaType === 'pdf' && (
              <div className="hidden sm:flex items-center space-x-1 mr-4 border-r border-slate-800 pr-4">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400 px-2">{zoom}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors ml-2 cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <button
              onClick={handleDownload}
              className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl transition-all flex items-center space-x-1 text-xs px-2.5 cursor-pointer"
            >
              {downloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span>Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Save</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => alert('Printing file simulator triggered!')}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Print File"
            >
              <Printer className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 bg-red-600/25 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors ml-4 cursor-pointer"
              title="Close View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
          
          {/* Main Visual Screen */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
            {mediaType === 'image' && (
              <img
                src={mediaUrl}
                alt={mediaTitle}
                className="max-w-full max-h-full object-contain rounded-2xl border border-slate-200 shadow-md transition-transform duration-200"
                style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
                referrerPolicy="no-referrer"
              />
            )}

            {mediaType === 'video' && (
              <div className="w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-lg flex items-center justify-center text-white">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="ml-1 text-xl">▶</span>
                  </div>
                  <h4 className="font-extrabold text-base mb-1">Portfolio Demonstration Video</h4>
                  <p className="text-xs text-slate-400">Press play to stream this project walkthrough</p>
                </div>
              </div>
            )}

            {mediaType === 'pdf' && (
              <div
                className="bg-white shadow-lg p-6 sm:p-12 w-full max-w-2xl border border-slate-200 my-4 origin-top transition-all duration-200 rounded-2xl"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  minHeight: '650px'
                }}
              >
                {/* Header of simulated PDF */}
                <div className="border-b-2 border-indigo-600 pb-4 mb-6 flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-extrabold font-sans text-slate-900 tracking-tight">
                      OneStop Online Services
                    </h1>
                    <p className="text-xs text-slate-500 font-mono">Specialized Business Solutions</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 text-[10px] font-mono text-indigo-700 uppercase font-bold">
                      Verified Portfolio
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Ref: {mediaTitle.split('.')[0]}</p>
                  </div>
                </div>

                {/* Sub-header */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <h2 className="text-sm font-extrabold text-slate-800 font-sans mb-1 uppercase tracking-wider">
                    Project Deliverable Report
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                    {description}
                  </p>
                </div>

                {/* Content pages / body */}
                <div className="space-y-4 font-sans text-xs text-slate-700 leading-relaxed">
                  <h3 className="font-bold text-slate-950 text-sm border-b border-slate-100 pb-1">
                    1. Scope and Implementation Details
                  </h3>
                  <p>
                    This document serves as an official deliverable demonstration of our professional operations.
                    All figures, custom workflows, formulas, and strategies showcased herein were designed by
                    our lead specialist team to resolve operational barriers and financial backlogs.
                  </p>
                  
                  <h3 className="font-bold text-slate-950 text-sm border-b border-slate-100 pb-1 pt-2">
                    2. Applied Competencies & Methodologies
                  </h3>
                  <div className="grid grid-cols-2 gap-2 my-2">
                    {skills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-150">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        <span className="font-mono text-[11px] text-slate-700 font-medium">{skill}</span>
                      </div>
                    ))}
                  </div>

                  <h3 className="font-bold text-slate-950 text-sm border-b border-slate-100 pb-1 pt-2">
                    3. Performance Outcomes & Results
                  </h3>
                  <p>
                    • <strong>Automation Speedup:</strong> Enabled instantaneous document creation or calculations using standard frameworks.<br />
                    • <strong>Auditing Compliance:</strong> Achieved absolute GAAP, SOX, or tax standard synchronization.<br />
                    • <strong>Error Mitigation:</strong> Reconciled long-term unorganized backlogs and cleared ledger bottlenecks.
                  </p>
                </div>

                {/* Footer of simulated PDF */}
                <div className="mt-12 pt-6 border-t border-slate-150 flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>© OneStopOnlineServices • Confirmed Deliverable</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            )}
          </div>

          {/* Details Sidebar panel */}
          <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <span className="px-2.5 py-1 text-[11px] font-bold font-mono tracking-wider text-indigo-700 bg-indigo-50 uppercase rounded-lg inline-block mb-3">
                {mediaType.toUpperCase()} Specimen
              </span>
              <h4 className="text-lg font-extrabold font-sans text-slate-900 mb-2 leading-tight">
                About this Deliverable
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans mb-4">
                This is a real-world client project example showcasing our standards. When you order from us, we establish these precise formatting rules, calculations, and visual styles for your business files.
              </p>

              <h5 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-2">
                Applied Skills
              </h5>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold uppercase tracking-tight rounded-lg transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-150 pt-4 mt-4">
              <div className="bg-indigo-50/40 rounded-xl p-3.5 border border-indigo-100/50 mb-3">
                <p className="text-[10px] text-indigo-900 font-medium leading-relaxed">
                  Need a similar high-quality setup, report, or tracking system configured for your business operations?
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  const target = document.getElementById('contact');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all text-center block cursor-pointer"
              >
                Order This Service Now
              </button>
            </div>
          </div>
          
        </div>
      </motion.div>
    </motion.div>
  );
}
