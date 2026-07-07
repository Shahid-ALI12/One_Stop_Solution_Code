const { JSDOM, VirtualConsole } = require('jsdom');

const vc = new VirtualConsole();
const errors = [];
vc.on('error', (err) => errors.push('VC ERROR: ' + (err?.stack || err)));
vc.on('jsdomError', (err) => errors.push('JSDOM ERROR: ' + (err?.stack || err) + (err.detail ? '\nDetail: ' + err.detail?.stack?.substring(0, 800) : '')));
vc.on('console error', (...args) => errors.push('CONSOLE ERROR: ' + args.join(' ')));
vc.on('console log', (...args) => errors.push('CONSOLE LOG: ' + args.join(' ')));

JSDOM.fromURL('http://127.0.0.1:3000/', {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
}).then(dom => {
  const { window } = dom;
  
  window.matchMedia = function(query) {
    return { matches: false, media: query, onchange: null, addListener: function() {}, removeListener: function() {}, addEventListener: function() {}, removeEventListener: function() {}, dispatchEvent: function() { return false; } };
  };
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);

  window.onerror = (msg, url, line, col, err) => {
    errors.push(`Uncaught: ${msg} at ${url}:${line}:${col}`);
    if (err?.stack) errors.push('Stack: ' + err.stack.split('\n').slice(0, 8).join('\n'));
  };
  window.addEventListener('unhandledrejection', (event) => {
    errors.push(`Unhandled rejection: ${event.reason?.message || event.reason}`);
  });

  setTimeout(() => {
    console.log('=== ERRORS (' + errors.length + ') ===');
    errors.forEach((e, i) => console.log(`[${i+1}]`, e));
    
    console.log('\n=== Rendered DOM ===');
    const root = window.document.getElementById('root');
    console.log('Root innerHTML length:', root.innerHTML.length);
    if (root.innerHTML.length > 0) {
      console.log('Root content (first 1500):', root.innerHTML.substring(0, 1500));
    } else {
      console.log('ROOT IS EMPTY');
    }
    
    process.exit(0);
  }, 8000);
}).catch(e => {
  console.log('JSDOM error:', e.message);
  process.exit(1);
});
