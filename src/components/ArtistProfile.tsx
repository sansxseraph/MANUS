import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ProjectCard, Tag } from './ProjectCard';
import { UserPlus, MessageCircle, Share2, Globe, Twitter, Instagram, Loader2 } from 'lucide-react';
import { ManiculeBadge } from './ManiculeBadge';
import { db, doc, getDoc, collection, query, where, getDocs, orderBy } from '../firebase';
import { ProjectFolder } from '../types';

export const ArtistProfile: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const [artist, setArtist] = React.useState<any>(null);
  const [projects, setProjects] = React.useState<ProjectFolder[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchArtistData = async () => {
      if (!artistId) return;
      
      try {
        // Fetch artist profile
        const artistDoc = await getDoc(doc(db, 'users', artistId));
        if (artistDoc.exists()) {
          setArtist({ id: artistDoc.id, ...artistDoc.data() });
        }

        // Fetch artist projects
        const q = query(
          collection(db, 'projects'), 
          where('authorUid', '==', artistId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ProjectFolder[];
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-manus-dark">
        <Loader2 className="w-12 h-12 text-manus-orange animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-manus-white bg-manus-dark">
        <h1 className="text-4xl mb-4 font-display font-black uppercase tracking-widest">Artist Not Found</h1>
        <Link to="/" className="text-manus-cyan hover:underline font-bold uppercase tracking-widest text-xs">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-manus-dark">
      {/* Banner Area */}
      <div className="relative h-[30vh] md:h-[40vh] overflow-hidden">
        <img 
          src={artist.bannerUrl || `https://picsum.photos/seed/${artistId}/1920/1080?blur=10`} 
          alt={`${artist.displayName} banner`}
          className="w-full h-full object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-manus-dark via-manus-dark/20 to-transparent" />
        
        {/* Technical Overlay */}
        <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-manus-cyan/10 border border-manus-cyan/20 rounded-sm">
            <div className="w-1.5 h-1.5 bg-manus-cyan rounded-full animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-manus-cyan tracking-widest uppercase">UPLINK ACTIVE</span>
          </div>
          <div className="text-[8px] font-mono text-manus-white/20 tracking-[0.3em] uppercase">
            LATENCY: 24ms // STABLE
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          {/* Left Column: Avatar & Stats */}
          <div className="lg:col-span-4">
            <div className="bg-manus-white/5 border border-manus-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative mb-8 flex justify-center"
              >
                <div className="relative">
                  <img
                    src={artist.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artistId}`}
                    alt={artist.displayName}
                    className="w-48 h-48 rounded-2xl border-2 border-manus-cyan/50 shadow-[0_0_30px_rgba(12,177,199,0.2)]"
                    referrerPolicy="no-referrer"
                  />
                  {artist.role === 'admin' && (
                    <div className="absolute -top-3 -right-3">
                      <ManiculeBadge size="md" />
                    </div>
                  )}
                </div>
              </motion.div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-mono font-black text-manus-white">{projects.length}</div>
                    <div className="text-[8px] font-mono text-manus-white/40 uppercase tracking-widest">WORKS</div>
                  </div>
                  <div className="text-center border-x border-manus-white/10">
                    <div className="text-xl font-mono font-black text-manus-white">1.2K</div>
                    <div className="text-[8px] font-mono text-manus-white/40 uppercase tracking-widest">FOLLOWERS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-mono font-black text-manus-white">482</div>
                    <div className="text-[8px] font-mono text-manus-white/40 uppercase tracking-widest">FOLLOWING</div>
                  </div>
                </div>

                <div className="pt-6 border-t border-manus-white/10 flex flex-col gap-3">
                  <button className="w-full py-3 bg-manus-cyan text-manus-dark font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-white transition-all shadow-lg shadow-manus-cyan/20">
                    FOLLOW ARTIST
                  </button>
                  <button className="w-full py-3 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-white/10 transition-all">
                    SEND MESSAGE
                  </button>
                </div>

                <div className="pt-6 border-t border-manus-white/10 flex justify-center gap-6">
                  <Globe className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                  <Twitter className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                  <Instagram className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                  <Share2 className="w-5 h-5 text-manus-white/40 hover:text-manus-cyan cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Details */}
          <div className="lg:col-span-8 pt-8">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-5xl md:text-6xl font-display font-black text-manus-white tracking-tighter">
                  {artist.displayName}
                </h1>
                {artist.role === 'admin' && (
                  <div className="px-3 py-1 bg-manus-orange/10 border border-manus-orange/20 rounded-sm">
                    <span className="text-[10px] font-mono font-bold text-manus-orange tracking-widest uppercase">VERIFIED</span>
                  </div>
                )}
              </div>
              <p className="text-xl text-manus-white/60 font-medium leading-relaxed max-w-3xl">
                {artist.bio || "This artist hasn't added a bio yet. They're letting their work speak for itself."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-6 bg-manus-white/5 border border-manus-white/10 rounded-2xl">
                <div className="text-[10px] font-mono text-manus-cyan uppercase tracking-widest mb-4">SPECIALIZATIONS</div>
                <div className="flex flex-wrap gap-2">
                  {artist.tags?.map((tag: string) => (
                    <Tag key={tag} label={tag} className="text-[9px] px-3 py-1" />
                  )) || (
                    <span className="text-[10px] font-mono text-manus-white/20 uppercase tracking-widest">NO TAGS RECORDED</span>
                  )}
                </div>
              </div>
              <div className="p-6 bg-manus-white/5 border border-manus-white/10 rounded-2xl">
                <div className="text-[10px] font-mono text-manus-cyan uppercase tracking-widest mb-4">SYSTEM LOGS</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-manus-white/40">JOINED:</span>
                    <span className="text-manus-white/80">MAR 2024</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-manus-white/40">LAST ACTIVE:</span>
                    <span className="text-manus-white/80">2 HOURS AGO</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-manus-white/40">LOCATION:</span>
                    <span className="text-manus-white/80">TOKYO, JP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mb-32">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-display font-black text-manus-white tracking-widest uppercase">ARCHIVE</h2>
              <div className="h-px w-24 bg-manus-white/10 hidden md:block" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-manus-cyan rounded-full animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-manus-white/40 uppercase tracking-widest">
                {projects.length} DATA_POINTS
              </span>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center border border-dashed border-manus-white/10 rounded-[3rem]">
              <p className="text-manus-white/20 font-display font-black text-3xl uppercase tracking-[0.2em]">
                NO DATA RECORDED IN ARCHIVE
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
