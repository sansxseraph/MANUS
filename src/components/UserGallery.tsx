import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { db, doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot } from '../firebase';
import { ProjectFolder } from '../types';
import { ProjectCard } from './ProjectCard';
import { Loader2, ArrowLeft, Grid, Layout, Maximize2, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const UserGallery: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [artist, setArtist] = React.useState<any>(null);
  const [projects, setProjects] = React.useState<ProjectFolder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'grid' | 'masonry' | 'full'>('grid');

  const effectiveArtistId = artistId || currentUser?.uid;

  React.useEffect(() => {
    if (authLoading) return;

    if (!effectiveArtistId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const artistRef = doc(db, 'profiles', effectiveArtistId);
    
    const unsubscribeProfile = onSnapshot(artistRef, (docSnap) => {
      if (docSnap.exists()) {
        setArtist({ id: docSnap.id, ...docSnap.data() });
      } else if (effectiveArtistId === currentUser?.uid) {
        // Fallback to current user data if profile doc isn't found yet
        setArtist({
          id: currentUser.uid,
          displayName: currentUser.displayName || 'Anonymous Artist',
          photoURL: currentUser.photoURL,
          role: 'user'
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to artist profile:", error);
      setLoading(false);
    });

    const fetchProjects = async () => {
      try {
        // Fetch artist projects
        try {
          const q = query(
            collection(db, 'projects'),
            where('authorUid', '==', effectiveArtistId),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const projectsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ProjectFolder[];
          setProjects(projectsData);
        } catch (queryError) {
          console.warn("Query with orderBy failed, trying without orderBy:", queryError);
          // Fallback query in case index is missing
          const fallbackQ = query(
            collection(db, 'projects'),
            where('authorUid', '==', effectiveArtistId)
          );
          const querySnapshot = await getDocs(fallbackQ);
          const projectsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ProjectFolder[];
          // Sort manually if fallback was used
          projectsData.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          });
          setProjects(projectsData);
        }
      } catch (error) {
        console.error("Error fetching gallery data:", error);
      }
    };

    fetchProjects();

    return () => unsubscribeProfile();
  }, [effectiveArtistId, authLoading, currentUser]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-manus-dark">
        <Loader2 className="w-12 h-12 text-manus-orange animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-manus-dark text-manus-white px-6 text-center">
        <h1 className="text-4xl font-display font-black uppercase mb-4">ARCHIVE NOT FOUND</h1>
        <Link to="/" className="text-manus-cyan hover:underline uppercase tracking-widest text-xs font-bold">Return to Sanctuary</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-manus-dark text-manus-white">
      {/* Archive Header */}
      <div className={cn(
        "border-b border-manus-white/10 px-6 py-8 sticky top-[72px] z-30 bg-manus-dark/90 backdrop-blur-xl"
      )}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link to={`/artist/${artist.id}`} className="group flex items-center gap-6">
              <div className={cn(
                "w-24 h-24 overflow-hidden border border-manus-white/10 group-hover:border-manus-cyan transition-all duration-500 shadow-[0_0_20px_rgba(12,177,199,0.1)]",
                artist.avatarShape === 'circle' ? "rounded-full" : "rounded-2xl"
              )}>
                <img 
                  src={artist.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.id}`} 
                  alt={artist.displayName}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-2xl font-display font-black tracking-tighter uppercase group-hover:text-manus-cyan transition-colors">
                  {artist.displayName}
                </h1>
                <p className="text-xs font-mono text-manus-cyan font-bold uppercase tracking-widest mb-2">
                  @{artist.handle?.replace(/^@/, '') || artist.displayName.toLowerCase().replace(/\s+/g, '_')}
                </p>
                <div className="max-w-md">
                  <p className="text-xs font-mono text-manus-white/40 uppercase leading-relaxed line-clamp-3 italic">
                    {artist.bio || "No bio available."}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-8">
            <Link 
              to={`/artist/${artist.id}`}
              className="px-6 py-3 bg-manus-white/5 border border-manus-white/10 text-manus-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-manus-cyan hover:text-manus-dark hover:border-manus-cyan transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              RETURN TO PROFILE
            </Link>
            {artist && currentUser?.uid === artist.id && (
              <Link 
                to={`/artist/${artist.id}?edit=true`}
                className="p-2 bg-manus-white/5 border border-manus-white/10 rounded-lg text-manus-white/40 hover:text-manus-cyan hover:border-manus-cyan transition-all"
                aria-label="Edit Profile"
                title="Edit Profile"
              >
                <Edit3 className="w-5 h-5" />
              </Link>
            )}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'grid' ? "bg-manus-cyan text-manus-dark" : "text-manus-white/40 hover:text-manus-white hover:bg-manus-white/5"
                )}
                aria-label="Grid View"
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('masonry')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'masonry' ? "bg-manus-cyan text-manus-dark" : "text-manus-white/40 hover:text-manus-white hover:bg-manus-white/5"
                )}
                aria-label="Masonry View"
                title="Masonry View"
              >
                <Layout className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('full')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'full' ? "bg-manus-cyan text-manus-dark" : "text-manus-white/40 hover:text-manus-white hover:bg-manus-white/5"
                )}
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
            <div className="h-8 w-px bg-manus-white/10 hidden md:block" />
            <div className="hidden md:block">
              <div className="text-xs font-mono text-manus-white/40 uppercase tracking-widest mb-1">DATA_POINTS</div>
              <div className="text-xl font-mono font-black text-manus-white">{projects.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Archive Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {projects.length > 0 ? (
          <div className={cn(
            viewMode !== 'masonry' ? "grid gap-8" : "columns-1 sm:columns-2 lg:columns-3 space-y-8",
            viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            viewMode === 'full' && "grid-cols-1"
          )}>
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  viewMode === 'masonry' && "break-inside-avoid"
                )}
              >
                <ProjectCard 
                  project={project} 
                  className={cn(
                    viewMode === 'full' && "max-w-4xl mx-auto"
                  )}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center border border-dashed border-manus-white/10 rounded-[3rem]">
            <p className="text-manus-white/20 font-display font-black text-4xl uppercase tracking-[0.2em]">
              NO DATA RECORDED IN ARCHIVE
            </p>
          </div>
        )}
      </div>

      {/* Technical Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-manus-white/5 flex justify-between items-center opacity-20">
        <div className="text-[10px] font-mono tracking-[0.4em] uppercase">
          SYSTEM_ARCHIVE_VIEW // {artist.id.toUpperCase()}
        </div>
        <div className="text-[10px] font-mono tracking-[0.4em] uppercase">
          STABLE_CONNECTION // {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
