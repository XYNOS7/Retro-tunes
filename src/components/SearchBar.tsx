import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import { Song } from '@/types/song';
import { usePlaylist } from '@/context/PlaylistContext';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { playSong } = usePlaylist();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const searchSongs = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .ilike('title', `%${debouncedQuery}%`)
          .order('title')
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error('Error searching songs:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchSongs();
  }, [debouncedQuery]);

  const handleSongClick = (song: Song) => {
    playSong(song.url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div 
        ref={searchRef}
        className="absolute top-0 left-0 right-0 bg-background border-b shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="relative">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs..."
                className="w-full bg-transparent border-none outline-none text-lg"
                autoFocus
              />
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="absolute left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y">
                  {results.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => handleSongClick(song)}
                      className="p-4 hover:bg-accent cursor-pointer transition-colors"
                    >
                      <p className="font-medium">{song.title}</p>
                    </div>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-4 text-center text-muted-foreground">
                  No results found
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 