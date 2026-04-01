import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MOCK_PROJECTS, CURATED_TAGS, MOCK_ARTISTS } from '../constants';
import { ProjectCard, Tag } from './ProjectCard';
import { Search, Filter, TrendingUp, Clock, Star, Loader2, PlusCircle } from 'lucide-react';
import { ManiculeBadge } from './ManiculeBadge';
import { cn } from '../lib/utils';
import { db, collection, onSnapshot, query, orderBy, limit } from '../firebase';
import { ProjectFolder } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTag, setActiveTag] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<ProjectFolder[]>([]);
  const [artists, setArtists] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(50));
    const artistsQuery = query(collection(db, 'profiles'), limit(12));
    
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProjectFolder[];
      setProjects(projectsData);
    });

    const unsubscribeArtists = onSnapshot(artistsQuery, (snapshot) => {
      const artistsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArtists(artistsData);
      setLoading(false);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeArtists();
    };
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = activeTag ? project.tags.includes(activeTag) : true;
    
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-manus-dark pb-24">
      {/* Hero Section */}
      <div className="relative min-h-[55vh] md:h-[55vh] flex items-center justify-center overflow-hidden bg-manus-dark pt-24 md:pt-0">
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pb-12 md:pb-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="flex flex-row items-center justify-center gap-2 md:gap-1.5">
                <div className="w-12 h-12 md:w-28 md:h-28 flex items-center justify-center">
                  <img 
                    src="/logo.svg" 
                    alt="MANUS Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-12 h-12 md:w-28 md:h-28 bg-manus-orange rounded-xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-manus-orange/20 rotate-12"><svg viewBox="210 220 230 200" class="w-7 h-7 md:w-16 md:h-16 text-manus-white fill-current -rotate-12"><path d="M231.15,247.15c34.4,34.8,68.9,69.5,103.3,104.3.7,1,5.4,7.3,13,7.6,1.5,0,6.1.2,9.3-3.1,2.7-2.8,2.8-6.4,2.8-7.6.2-7.4-5.9-12.3-6.8-13-35.2-35.2-70.5-70.3-105.7-105.5-1-.8-3.1-2.5-6.2-3-1-.2-5.7-1-9.6,2.2-3.4,2.8-4,6.7-4.1,8-.5,5.8,3.4,9.6,4,10.2v-.1Z"/><path d="M321.55,378.15c4.2,3.6,12.7,9.4,24.7,10,19.2.9,31.2-12.4,32.8-14.1,2.8-3.3,10.5-13,10.2-27.4-.3-14.6-8.6-24-10.7-26.3-31.5-31.6-63-63.2-94.5-94.9-1.3-1.1-3.3-2.5-6.2-3-.3,0-.6,0-.7-.1-1.7-.2-5.6-.4-8.9,2.3-3.4,2.7-4,6.6-4.1,8-.5,5.8,3.4,9.6,4,10.2,31.4,31.4,62.9,62.7,94.3,94.1.8,1.2,3.7,5.6,3.2,11.7-.1,1.7-.8,6.4-4.5,10.4-5,5.4-11.6,5.6-13.3,5.6-4.5,0-8.1-1.5-10.3-2.8l.2-.2-94.5-94.9c-1-.8-3.1-2.5-6.2-3-1-.2-5.7-1-9.6,2.2-3.4,2.8-4,6.7-4.1,8-.5,5.8,3.4,9.6,4,10.2,31.4,31.4,62.9,62.7,94.3,94.1l.1-.1h-.2Z"/><path d="M417.25,343.55c-.5-11.1-3.4-19.3-4.2-21.5-4.4-11.9-11.2-19.7-14.3-23.2-2.5-2.8-4.7-4.9-6.3-6.4-11.2-10.9-22.4-21.8-33.6-32.8-2-1.9-4.1-3.8-6.1-5.8-1.5-1.5-3.1-2.9-4.6-4.4-1.3.4-3.5,1.4-5.6,3.4-.9.9-4.1,4.1-4.5,9-.3,3.7,1,6.4,2.7,10,1.7,3.5,3.7,6.1,5.2,7.7,12.4,12.1,24.8,24.3,37.3,36.4,3,3.9,7.9,11.2,9.9,21.5.6,3.3,4.2,24.1-10.4,40.7-11.5,13-26.6,14.9-30.2,15.2-13,1.3-22.9-3.4-26.3-5.1-4.7-2.3-8.2-4.9-10.6-6.9h0c-22.1-22.4-44.2-44.8-66.3-67.2-1-1-3.1-2.9-6.5-3.7-1.4-.3-6.7-1.3-10.7,2.2-2.8,2.5-3.3,5.9-3.5,7.1-.8,5.8,2.6,10.1,3.3,11.1,22.2,22.1,44.4,44.3,66.6,66.4l.2-.2c2.1,2.1,4.7,4.4,7.7,6.6.7.5,5.1,3.7,10.6,6.4,15.1,7.4,31,7.1,32.8,7.1,9-.3,16.6-2.3,22-4.2,5.5-2,24.8-9.4,36.7-29.9,9.6-16.6,9.1-32.6,8.8-39.5h-.1Z"/></svg></div>';
                      }
                    }}
                  />
                </div>
                <h1 className="text-5xl md:text-9xl font-display font-black text-manus-white tracking-tighter uppercase leading-none">
                  MANUS
                </h1>
              </div>
              <h2 className="text-lg md:text-4xl font-sans font-bold text-manus-orange tracking-widest uppercase">
                Build. Share. Connect.
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => {
                  if (user) {
                    navigate('/gallery');
                  } else {
                    setIsLoginOpen(true);
                  }
                }}
                className="w-full sm:w-auto bg-manus-orange text-manus-white font-black px-12 py-5 rounded-full text-lg hover:scale-105 transition-all shadow-2xl shadow-manus-orange/30 uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <PlusCircle className="w-6 h-6" />
                START YOUR ARCHIVE
              </button>
              <button 
                onClick={() => document.getElementById('gallery-start')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto bg-manus-white/10 text-manus-white font-black px-12 py-5 rounded-full text-lg hover:bg-manus-white/20 transition-all uppercase tracking-widest"
              >
                EXPLORE ART
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />

      {/* Filter Bar */}
      <div id="gallery-start" className="sticky top-[72px] z-40 bg-manus-dark/90 backdrop-blur-xl border-y border-manus-white/10 py-4 px-6 mb-12">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div 
              onClick={() => { setActiveTag(null); setSearchQuery(''); }}
              className={cn(
                "flex items-center gap-2 font-bold text-sm uppercase tracking-widest cursor-pointer transition-colors",
                !activeTag && searchQuery === '' ? "text-manus-cyan" : "text-manus-white/40 hover:text-manus-white"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              TRENDING
            </div>
            <div className="flex items-center gap-2 text-manus-white/40 hover:text-manus-white font-bold text-sm uppercase tracking-widest cursor-pointer transition-colors">
              <Clock className="w-4 h-4" />
              RECENT
            </div>
            <div className="flex items-center gap-2 text-manus-white/40 hover:text-manus-white font-bold text-sm uppercase tracking-widest cursor-pointer transition-colors">
              <Star className="w-4 h-4" />
              CURATED
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH ARTISTS, TAGS, PROJECTS..."
                className="w-full bg-manus-white/5 border border-manus-white/10 rounded-full py-3 pl-12 pr-6 text-xs font-bold text-manus-white placeholder:text-manus-white/20 focus:outline-none focus:border-manus-cyan transition-colors"
              />
            </div>
            <button className="p-3 rounded-full bg-manus-white/5 border border-manus-white/10 hover:bg-manus-white/10 transition-colors">
              <Filter className="w-4 h-4 text-manus-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Curated Tags List */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pb-8 mb-8 border-b border-manus-white/5">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              "text-xs font-black uppercase tracking-[0.2em] transition-all relative py-2",
              !activeTag 
                ? "text-manus-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-manus-orange" 
                : "text-manus-white/40 hover:text-manus-white"
            )}
          >
            ALL
          </button>
          {CURATED_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={cn(
                "text-xs font-black uppercase tracking-[0.2em] transition-all relative py-2",
                tag === activeTag 
                  ? "text-manus-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-manus-orange" 
                  : "text-manus-white/40 hover:text-manus-white"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* New Section */}
        {!activeTag && searchQuery === '' && (
          <div className="mb-24">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-display font-black text-manus-white uppercase tracking-widest">NEW</h2>
                <div className="h-px w-12 bg-manus-white/10" />
                <span className="text-xs font-mono text-manus-white/20 uppercase tracking-[0.3em]">LATEST_UPLOADS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-manus-orange rounded-full animate-pulse" />
                <span className="text-xs font-mono font-bold text-manus-white/40 uppercase tracking-widest">LIVE_FEED</span>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-manus-orange animate-spin" />
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {projects.slice(0, 6).map(project => (
                  <div
                    key={project.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-manus-white/5 border border-manus-white/10 hover:border-manus-cyan/50 transition-all"
                  >
                    <Link to={`/project/${project.id}`} className="absolute inset-0 z-0">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                    {project.hasManicule && (
                      <div className="absolute top-2 right-2 z-10 pointer-events-none">
                        <ManiculeBadge size="sm" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-manus-dark/90 via-manus-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
                      <Link to={`/project/${project.id}`} className="pointer-events-auto">
                        <p className="text-xs font-display font-black text-manus-white truncate uppercase tracking-tight mb-0.5">{project.title}</p>
                      </Link>
                      <Link to={`/artist/${project.authorUid}`} className="pointer-events-auto hover:text-manus-white transition-colors">
                        <p className="text-xs font-mono font-bold text-manus-cyan uppercase tracking-widest">@{project.authorName.split(' ')[0].toUpperCase()}</p>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-manus-white/10 rounded-3xl">
                <p className="text-manus-white/20 font-display font-black text-xl uppercase tracking-widest">
                  NO PROJECTS YET
                </p>
              </div>
            )}
          </div>
        )}

        {/* Featured Section */}
        {!activeTag && searchQuery === '' && (
          <div className="mb-24">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-display font-black text-manus-white uppercase tracking-widest">FEATURED</h2>
                <div className="h-px w-12 bg-manus-white/10" />
                <span className="text-xs font-mono text-manus-white/20 uppercase tracking-[0.3em]">CURATED_SELECTION</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-manus-cyan rounded-full animate-pulse" />
                <span className="text-xs font-mono font-bold text-manus-white/40 uppercase tracking-widest">VERIFIED_ONLY</span>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-manus-cyan animate-spin" />
              </div>
            ) : artists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artists.slice(0, 6).map(artist => (
                  <Link
                    key={artist.id}
                    to={`/artist/${artist.id}`}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-manus-white/5 border border-manus-white/10 hover:border-manus-cyan/50 transition-all"
                  >
                    <img
                      src={artist.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.id}`}
                      alt={artist.displayName}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    {artist.role === 'admin' && (
                      <div className="absolute top-2 right-2 z-10">
                        <ManiculeBadge size="sm" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-manus-dark/90 via-manus-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-xs font-display font-black text-manus-white truncate uppercase tracking-tight mb-0.5">{artist.displayName}</p>
                      <p className="text-xs font-mono font-bold text-manus-cyan uppercase tracking-widest">@{artist.displayName?.split(' ')[0].toUpperCase()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-manus-white/10 rounded-3xl">
                <p className="text-manus-white/20 font-display font-black text-xl uppercase tracking-widest">
                  NO ARTISTS YET
                </p>
              </div>
            )}
          </div>
        )}

        {/* Search/Filter Results Grid */}
        {(activeTag || searchQuery !== '') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-manus-white/40 font-display font-black text-2xl uppercase tracking-widest">
                  NO PROJECTS FOUND
                </p>
                <button 
                  onClick={() => { setActiveTag(null); setSearchQuery(''); }}
                  className="mt-4 text-manus-cyan hover:underline font-bold uppercase text-xs tracking-widest"
                >
                  CLEAR ALL FILTERS
                </button>
              </div>
            )}
          </div>
        )}

        {/* Load More */}
        {(activeTag || searchQuery !== '') && (
          <div className="mt-24 flex justify-center">
            <button className="group flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-manus-white/10 flex items-center justify-center group-hover:border-manus-cyan group-hover:bg-manus-cyan/10 transition-all duration-500">
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Clock className="w-6 h-6 text-manus-white/40 group-hover:text-manus-cyan" />
                </motion.div>
              </div>
              <span className="text-xs font-black text-manus-white/40 group-hover:text-manus-cyan tracking-[0.2em] uppercase transition-colors">
                LOAD MORE WORK
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
