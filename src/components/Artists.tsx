import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MOCK_ARTISTS } from '../constants';
import { ManiculeBadge } from './ManiculeBadge';
import { Search, Filter, UserPlus } from 'lucide-react';

export const Artists: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredArtists = MOCK_ARTISTS.filter(artist => 
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-manus-dark pb-32">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-manus-cyan animate-pulse" />
              <span className="text-[10px] font-mono text-manus-cyan uppercase tracking-[0.3em]">DIRECTORY_ACTIVE</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-black text-manus-white mb-4 uppercase tracking-tighter">
              ARTISTS
            </h1>
            <p className="text-manus-white/40 text-sm max-w-xl uppercase tracking-[0.2em] font-mono">
              [ SYSTEM_LOG: {filteredArtists.length} CREATORS_IDENTIFIED ]
            </p>
          </div>

          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-manus-white/20 group-focus-within:text-manus-cyan transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH_CREATORS..."
                className="w-full bg-manus-white/5 border border-manus-white/10 rounded-xl py-5 pl-14 pr-6 text-[10px] font-mono font-bold text-manus-white placeholder:text-manus-white/20 focus:outline-none focus:border-manus-cyan/50 focus:bg-manus-white/10 transition-all uppercase tracking-widest"
              />
            </div>
            <button className="p-5 rounded-xl bg-manus-white/5 border border-manus-white/10 hover:bg-manus-white/10 transition-colors">
              <Filter className="w-4 h-4 text-manus-white/60" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredArtists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-manus-white/5 border border-manus-white/10 rounded-3xl p-8 hover:border-manus-cyan/30 transition-all overflow-hidden"
            >
              {/* Technical Overlay */}
              <div className="absolute top-0 right-0 p-4 pointer-events-none">
                <span className="text-[8px] font-mono text-manus-white/10 uppercase tracking-widest">REF_0{index + 1}</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-8 relative z-10">
                <Link to={`/artist/${artist.id}`} className="shrink-0 relative">
                  <div className="relative p-1 border border-manus-white/10 rounded-2xl group-hover:border-manus-cyan/50 transition-colors">
                    <img
                      src={artist.avatar}
                      alt={artist.name}
                      className="w-28 h-28 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {artist.hasManicule && (
                      <div className="absolute -top-2 -right-2">
                        <ManiculeBadge size="sm" />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Link to={`/artist/${artist.id}`}>
                      <h3 className="text-3xl font-display font-black text-manus-white group-hover:text-manus-cyan transition-colors uppercase tracking-tight truncate">
                        {artist.name}
                      </h3>
                    </Link>
                  </div>
                  <p className="text-manus-cyan text-[10px] font-mono font-bold uppercase tracking-widest mb-4">
                    @{artist.username}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <div className="text-[8px] font-mono text-manus-white/20 uppercase tracking-widest mb-1">WORKS</div>
                      <div className="text-sm font-mono font-black text-manus-white/80">124</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-manus-white/20 uppercase tracking-widest mb-1">FOLLOWS</div>
                      <div className="text-sm font-mono font-black text-manus-white/80">8.2K</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-manus-white/20 uppercase tracking-widest mb-1">STATUS</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-manus-cyan shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
                        <span className="text-[9px] font-mono font-bold text-manus-cyan">LIVE</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {artist.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[8px] font-mono font-bold text-manus-white/40 uppercase tracking-widest px-3 py-1 bg-manus-white/5 border border-manus-white/5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none p-4 rounded-xl bg-manus-cyan text-manus-dark hover:bg-manus-white transition-all transform hover:scale-105">
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
