import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Song } from '@/types/song';

interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

interface PlaylistContextType {
  playlists: Playlist[];
  currentPlaylistId: string | null;
  setCurrentPlaylistId: (id: string | null) => void;
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  createPlaylist: (name: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  isSongInPlaylist: (playlistId: string, songId: string) => boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  playSong: (urlOrIndex: string | number) => Promise<void>;
  pauseSong: () => void;
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('playlists');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [songs, setSongs] = useState<Song[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };
    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleError = (e: ErrorEvent) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
    };
  }, []);

  const playSong = async (urlOrIndex: string | number) => {
    if (!audioRef.current) return;

    try {
      let url: string;
      let newIndex: number;

      if (typeof urlOrIndex === 'string') {
        // If a URL is provided, find the song in the songs array
        const songIndex = songs.findIndex(song => song.url === urlOrIndex);
        if (songIndex === -1) {
          console.error('Song not found in songs array');
          return;
        }
        url = urlOrIndex;
        newIndex = songIndex;
      } else {
        // If an index is provided, get the URL from the songs array
        if (urlOrIndex < 0 || urlOrIndex >= songs.length) {
          console.error('Invalid song index');
          return;
        }
        url = songs[urlOrIndex].url;
        newIndex = urlOrIndex;
      }

      // Update the current song index
      setCurrentSongIndex(newIndex);
      // Reset playlist context when playing directly from search
      setCurrentPlaylistId(null);

      // Set the audio source and play
      audioRef.current.src = url;
      audioRef.current.load();
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing song:', error);
      setIsPlaying(false);
    }
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      songs: [],
    };
    setPlaylists([...playlists, newPlaylist]);
  };

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    setPlaylists(playlists.map(playlist => {
      if (playlist.id === playlistId && !playlist.songs.some(s => s.id === song.id)) {
        return {
          ...playlist,
          songs: [...playlist.songs, song],
        };
      }
      return playlist;
    }));
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(playlists.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter(song => song.id !== songId),
        };
      }
      return playlist;
    }));
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(playlists.filter(playlist => playlist.id !== playlistId));
    if (currentPlaylistId === playlistId) {
      setCurrentPlaylistId(null);
      setCurrentSongIndex(-1);
      setIsPlaying(false);
    }
  };

  const isSongInPlaylist = (playlistId: string, songId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.songs.some(song => song.id === songId) : false;
  };

  const value = {
    playlists,
    currentPlaylistId,
    setCurrentPlaylistId,
    currentSongIndex,
    setCurrentSongIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    createPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    deletePlaylist,
    isSongInPlaylist,
    audioRef,
    playSong,
    pauseSong,
    songs,
    setSongs,
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
      <audio 
        ref={audioRef} 
        preload="metadata"
        playsInline
        webkit-playsinline="true"
      />
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}; 