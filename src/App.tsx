import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Twitter, Instagram } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Artists } from './components/Artists';
import { ArtistProfile } from './components/ArtistProfile';
import { UserGallery } from './components/UserGallery';
import { ProjectView } from './components/ProjectView';
import { Messages } from './components/Messages';
import { NotFound } from './components/NotFound';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-manus-dark text-manus-white selection:bg-manus-orange selection:text-manus-white">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Home />} />
              <Route path="/curated" element={<Home />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/artist/:artistId" element={<ArtistProfile />} />
              <Route path="/gallery/:artistId" element={<UserGallery />} />
              <Route path="/gallery" element={<UserGallery />} />
              <Route path="/project/:projectId" element={<ProjectView />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<ArtistProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

        <footer className="bg-manus-dark border-t border-manus-white/10 py-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 flex items-center justify-center">
                  <img 
                    src="/logo.svg" 
                    alt="MANUS Logo" 
                    className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-7 h-7 bg-manus-orange rounded-full flex items-center justify-center"><svg viewBox="210 220 230 200" class="w-4 h-4 text-manus-white fill-current"><path d="M231.15,247.15c34.4,34.8,68.9,69.5,103.3,104.3.7,1,5.4,7.3,13,7.6,1.5,0,6.1.2,9.3-3.1,2.7-2.8,2.8-6.4,2.8-7.6.2-7.4-5.9-12.3-6.8-13-35.2-35.2-70.5-70.3-105.7-105.5-1-.8-3.1-2.5-6.2-3-1-.2-5.7-1-9.6,2.2-3.4,2.8-4,6.7-4.1,8-.5,5.8,3.4,9.6,4,10.2v-.1Z"/><path d="M321.55,378.15c4.2,3.6,12.7,9.4,24.7,10,19.2.9,31.2-12.4,32.8-14.1,2.8-3.3,10.5-13,10.2-27.4-.3-14.6-8.6-24-10.7-26.3-31.5-31.6-63-63.2-94.5-94.9-1.3-1.1-3.3-2.5-6.2-3-.3,0-.6,0-.7-.1-1.7-.2-5.6-.4-8.9,2.3-3.4,2.7-4,6.6-4.1,8-.5,5.8,3.4,9.6,4,10.2,31.4,31.4,62.9,62.7,94.3,94.1.8,1.2,3.7,5.6,3.2,11.7-.1,1.7-.8,6.4-4.5,10.4-5,5.4-11.6,5.6-13.3,5.6-4.5,0-8.1-1.5-10.3-2.8l.2-.2-94.5-94.9c-1-.8-3.1-2.5-6.2-3-1-.2-5.7-1-9.6,2.2-3.4,2.8-4,6.7-4.1,8-.5,5.8,3.4,9.6,4,10.2,31.4,31.4,62.9,62.7,94.3,94.1l.1-.1h-.2Z"/><path d="M417.25,343.55c-.5-11.1-3.4-19.3-4.2-21.5-4.4-11.9-11.2-19.7-14.3-23.2-2.5-2.8-4.7-4.9-6.3-6.4-11.2-10.9-22.4-21.8-33.6-32.8-2-1.9-4.1-3.8-6.1-5.8-1.5-1.5-3.1-2.9-4.6-4.4-1.3.4-3.5,1.4-5.6,3.4-.9.9-4.1,4.1-4.5,9-.3,3.7,1,6.4,2.7,10,1.7,3.5,3.7,6.1,5.2,7.7,12.4,12.1,24.8,24.3,37.3,36.4,3,3.9,7.9,11.2,9.9,21.5.6,3.3,4.2,24.1-10.4,40.7-11.5,13-26.6,14.9-30.2,15.2-13,1.3-22.9-3.4-26.3-5.1-4.7-2.3-8.2-4.9-10.6-6.9h0c-22.1-22.4-44.2-44.8-66.3-67.2-1-1-3.1-2.9-6.5-3.7-1.4-.3-6.7-1.3-10.7,2.2-2.8,2.5-3.3,5.9-3.5,7.1-.8,5.8,2.6,10.1,3.3,11.1,22.2,22.1,44.4,44.3,66.6,66.4l.2-.2c2.1,2.1,4.7,4.4,7.7,6.6.7.5,5.1,3.7,10.6,6.4,15.1,7.4,31,7.1,32.8,7.1,9-.3,16.6-2.3,22-4.2,5.5-2,24.8-9.4,36.7-29.9,9.6-16.6,9.1-32.6,8.8-39.5h-.1Z"/></svg></div>';
                    }
                  }}
                  />
                </div>
                <span className="font-display font-black text-xl tracking-tighter text-manus-white leading-none uppercase">MANUS</span>
              </div>
              <p className="text-manus-white/40 text-sm font-medium max-w-xs text-center md:text-left">
                A non-algorithmic sanctuary for creators. Build your space, share your process, and connect with the community.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-12">
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-black text-manus-white uppercase tracking-widest">PLATFORM</h4>
                <Link to="/explore" className="text-sm font-medium text-manus-white/40 hover:text-manus-cyan transition-colors">EXPLORE</Link>
                <Link to="/artists" className="text-sm font-medium text-manus-white/40 hover:text-manus-cyan transition-colors">ARTISTS</Link>
                <Link to="/curated" className="text-sm font-medium text-manus-white/40 hover:text-manus-cyan transition-colors">CURATED</Link>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-black text-manus-white uppercase tracking-widest">COMMUNITY</h4>
                <Link to="/guidelines" className="text-sm font-medium text-manus-white/40 hover:text-manus-cyan transition-colors">GUIDELINES</Link>
                <Link to="/support" className="text-sm font-medium text-manus-white/40 hover:text-manus-cyan transition-colors">SUPPORT</Link>
                <Link to="/blog" className="text-sm font-medium text-manus-white/40 hover:text-manus-cyan transition-colors">BLOG</Link>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-black text-manus-white uppercase tracking-widest">LEGAL</h4>
                <Link to="/privacy" className="text-sm font-medium text-manus-white/40 hover:text-manus-cyan transition-colors">PRIVACY</Link>
                <Link to="/terms" className="text-sm font-medium text-manus-white/40 hover:text-manus-cyan transition-colors">TERMS</Link>
                <Link to="/copyright" className="text-sm font-medium text-manus-white/40 hover:text-manus-cyan transition-colors">COPYRIGHT</Link>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-manus-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[10px] font-black text-manus-white/20 uppercase tracking-[0.3em]">
              © 2026 MANUS ART GALLERY. ALL RIGHTS RESERVED.
            </div>
            <div className="flex items-center gap-6">
              <Twitter className="w-4 h-4 text-manus-white/20 hover:text-manus-cyan transition-colors cursor-pointer" />
              <Instagram className="w-4 h-4 text-manus-white/20 hover:text-manus-cyan transition-colors cursor-pointer" />
            </div>
          </div>
        </footer>
      </div>
    </Router>
    </AuthProvider>
  );
}
