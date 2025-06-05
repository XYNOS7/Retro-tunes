import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Play, Pause, SkipBack, SkipForward, Volume2, Heart, Trash2, Music, Shuffle, Plus, Search } from 'lucide-react';
import gsap from 'gsap';
import ThemeToggle from '@/components/ThemeToggle';
import { PlaylistModal } from '@/components/PlaylistModal';
import { PlaylistView } from '@/components/PlaylistView';
import { Button } from '@/components/ui/button';
import { PlaylistProvider, usePlaylist } from '@/context/PlaylistContext';
import { Song } from '@/types/song';
import { SearchBar } from '@/components/SearchBar';
import { UploadModal } from '@/components/UploadModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface Playlist {
  id: string;
  name: string;
  songs: string[];
}

type View = 'home' | 'playlist';

const IndexContent = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const nowPlayingRef = useRef<HTMLDivElement>(null);
  const playlistRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const albumArtRef = useRef<HTMLDivElement>(null);
  const equalizerRef = useRef<HTMLDivElement>(null);
  const vinylDiscRef = useRef<HTMLImageElement>(null);
  
  const { 
    songs, 
    setSongs,
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
    audioRef
  } = usePlaylist();

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || savedTheme === null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [shuffleMode, setShuffleMode] = useState<'off' | 'mixed'>('off');
  const [currentView, setCurrentView] = useState<View>('home');
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const savedPlaylists = localStorage.getItem('playlists');
    return savedPlaylists ? JSON.parse(savedPlaylists) : [];
  });
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSongs = async () => {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('uploaded_at', { ascending: false });

        if (error) throw error;
        setSongs(data || []);
      } catch (error) {
        console.error('Error loading songs:', error);
        toast.error('Failed to load songs');
      } finally {
        setIsLoading(false);
      }
    };

    loadSongs();
    // Apply initial theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkTheme(false);
    } else {
      setIsDarkTheme(true);
    }
  }, [setSongs]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => nextSong();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef.current, currentSongIndex]);

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Initialize animations on mount
  useEffect(() => {
    // Page load animations
    const tl = gsap.timeline();
    
    tl.from(headerRef.current, {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .from(nowPlayingRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.4")
    .from(playlistRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.4")
    .from(footerRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.4");

    // Album art rotation animation (managed by CSS animation-play-state now)
    if (albumArtRef.current) {
      gsap.killTweensOf(albumArtRef.current);
    }

    // Equalizer animation
    if (isPlaying && equalizerRef.current) {
      const bars = equalizerRef.current.children;
      gsap.to(bars, {
        height: "100%",
        duration: 0.5,
        stagger: 0.1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    } else if (equalizerRef.current) {
        gsap.killTweensOf(equalizerRef.current.children);
    }

    return () => {
      gsap.killTweensOf([headerRef.current, nowPlayingRef.current, playlistRef.current, footerRef.current, equalizerRef.current]);
    };
  }, [isPlaying]);

  // Sync vinyl disc animation with playback
  useEffect(() => {
    const vinylDisc = vinylDiscRef.current;
    if (vinylDisc) {
      if (isPlaying) {
        vinylDisc.style.animationPlayState = "running";
      } else {
        vinylDisc.style.animationPlayState = "paused";
      }
    }
  }, [isPlaying]);

  // Handle theme change
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }, [playlists]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Validate file
    if (!file.type.startsWith('audio/')) {
      toast.error(`${file.name} is not an audio file`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error(`${file.name} exceeds 10MB limit`);
      return;
    }

    setSelectedFile(file);
    setIsUploadModalOpen(true);
  };

  const handleUpload = async (songName: string, artistName: string) => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Create a signed URL for upload
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('songs')
        .createSignedUploadUrl(filePath);

      if (signedUrlError) {
        console.error('Error getting signed URL:', signedUrlError);
        throw signedUrlError;
      }

      // Upload using XMLHttpRequest to track progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            setUploadProgress(Math.round(percent));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Upload failed'));
        };

        xhr.open('PUT', signedUrlData.signedUrl);
        xhr.send(selectedFile);
      });

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('songs')
        .getPublicUrl(filePath);

      // Create song record in database
      const { data: song, error: dbError } = await supabase
        .from('songs')
        .insert([
          {
            title: songName,
            artist: artistName || 'Unknown Artist',
            url: publicUrl,
            uploaded_at: new Date().toISOString()
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      // Update local state
      setSongs(prev => [...prev, song as Song]);
      toast.success('Song uploaded successfully');
    } catch (error) {
      console.error('Error uploading song:', error);
      toast.error('Failed to upload song');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setIsUploadModalOpen(false);
      setUploadProgress(0);
    }
  };

  const playSong = (index: number) => {
    if (index === currentSongIndex) {
      // Toggle play/pause for current song
      if (isPlaying) {
        pauseSong();
      } else {
        // When resuming, ensure we have the correct audio source
        if (audioRef.current) {
          if (!audioRef.current.src) {
            audioRef.current.src = songs[index].url;
          }
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
      return;
    }

    // Play a new song
    setCurrentSongIndex(index);
    if (audioRef.current) {
      audioRef.current.src = songs[index].url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeSong = () => {
    if (audioRef.current) {
      if (!audioRef.current.src) {
        audioRef.current.src = songs[currentSongIndex].url;
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleShuffleMode = () => {
    setShuffleMode(prevMode => {
      if (prevMode === 'off') {
        return 'mixed';
      } else {
        return 'off';
      }
    });
  };

  const nextSong = () => {
    if (songs.length === 0) return;

    let nextIndex = -1;
    const currentPlaylist = currentPlaylistId
      ? playlists.find(p => p.id === currentPlaylistId)
      : null;

    if (currentPlaylist) {
      // Playlist-specific next song
      const playlistSongs = songs.filter(song => currentPlaylist.songs.includes(song.id));
      const currentSongInPlaylist = playlistSongs[currentSongIndex];
      const nextSongInPlaylist = playlistSongs[currentSongIndex + 1];
      
      if (nextSongInPlaylist) {
        nextIndex = songs.findIndex(song => song.id === nextSongInPlaylist.id);
      }
    } else {
      // Normal next song
      if (shuffleMode === 'mixed') {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * songs.length);
        } while (songs.length > 1 && randomIndex === currentSongIndex);
        nextIndex = randomIndex;
      } else {
        nextIndex = (currentSongIndex + 1) % songs.length;
      }
    }

    if (nextIndex !== -1) {
      playSong(nextIndex);
    }
  };

  const prevSong = () => {
    if (songs.length === 0) return;
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    let prevIndex = -1;
    const currentPlaylist = currentPlaylistId
      ? playlists.find(p => p.id === currentPlaylistId)
      : null;

    if (currentPlaylist) {
      // Playlist-specific previous song
      const playlistSongs = songs.filter(song => currentPlaylist.songs.includes(song.id));
      const prevSongInPlaylist = playlistSongs[currentSongIndex - 1];
      
      if (prevSongInPlaylist) {
        prevIndex = songs.findIndex(song => song.id === prevSongInPlaylist.id);
      }
    } else {
      // Normal previous song
      prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    }

    if (prevIndex !== -1) {
      playSong(prevIndex);
    }
  };

  const seekTo = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    seekTo(event);
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isDragging) {
      setIsDragging(false);
      seekTo(event);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isDragging) {
      seekTo(event);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    seekTo(event);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isDragging) {
      seekTo(event);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isDragging) {
      setIsDragging(false);
      seekTo(event);
    }
  };

  const deleteSong = async (songId: string, songUrl: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (dbError) throw dbError;

      // Delete from storage
      const filePath = songUrl.split('/').pop();
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('songs')
          .remove([`${user?.id}/${filePath}`]);

        if (storageError) throw storageError;
      }

      // Update local state
      setSongs(prev => prev.filter(song => song.id !== songId));

      // If the deleted song was the current song, stop playback
      if (currentSongIndex !== -1 && songs[currentSongIndex]?.id === songId) {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        setCurrentSongIndex(-1);
      }
      // If a song before the current one was deleted, adjust the index
      else if (currentSongIndex !== -1 && songs.findIndex(s => s.id === songId) < currentSongIndex) {
        setCurrentSongIndex(currentSongIndex - 1);
      }
      // If a song after the current one was deleted, no index adjustment needed

      toast.success('Song deleted successfully');
    } catch (error) {
      console.error('Error deleting song:', error);
      toast.error('Failed to delete song');
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSong = currentSongIndex >= 0 ? songs[currentSongIndex] : null;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleCreatePlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      songs: [],
    };
    setPlaylists([...playlists, newPlaylist]);
  };

  const handleAddToPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(playlists.map(playlist => {
      if (playlist.id === playlistId && !playlist.songs.includes(songId)) {
        return {
          ...playlist,
          songs: [...playlist.songs, songId],
        };
      }
      return playlist;
    }));
  };

  const handleRemoveFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(playlists.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter(id => id !== songId),
        };
      }
      return playlist;
    }));
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists(playlists.filter(playlist => playlist.id !== playlistId));
    if (currentPlaylistId === playlistId) {
      setCurrentPlaylistId(null);
      setCurrentSongIndex(-1);
      setIsPlaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-pink-500 animate-pulse" />
          <p className="text-xl font-mono">Loading your music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'dark' : ''}`}>
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Retro Tunes</h1>
            <div className="flex gap-2">
              <Button
                variant={currentView === 'home' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('home')}
              >
                Home
              </Button>
              <Button
                variant={currentView === 'playlist' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('playlist')}
              >
                Playlists
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="h-8 w-8"
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle isDarkTheme={isDarkTheme} setIsDarkTheme={setIsDarkTheme} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="audio/*"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </header>

      <main className="pt-20 pb-32">
        {currentView === 'home' ? (
          <div className="container mx-auto px-4">
            {/* Now Playing Section */}
            <div ref={nowPlayingRef} className="border-2 border-pink-500 bg-black/30 p-6 mb-6 text-center">
              <div ref={albumArtRef} className="w-64 h-64 mx-auto mb-6 border-2 border-cyan-400 bg-gray-800 flex items-center justify-center transform transition-transform duration-300 hover:scale-105 overflow-hidden rounded-full">
                <img
                  id="vinylDisc"
                  ref={vinylDiscRef}
                  src="/vinyl-record-isolated.jpg"
                  alt="Vinyl Record"
                  className="w-full h-full object-cover"
                  style={{ animation: 'spin 10s linear infinite paused' }}
                />
              </div>
              
              {/* Equalizer */}
              <div ref={equalizerRef} className="flex items-end justify-center gap-1 h-8 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-pink-500 to-cyan-400 rounded-full"
                    style={{ height: `${Math.random() * 100}%` }}
                  />
                ))}
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pink-500 mb-2">
                  {currentSong ? currentSong.title : 'No Track Selected'}
                </h2>
                <p className="text-cyan-400">
                  {currentSong ? currentSong.artist : 'Select a track to play'}
                </p>
              </div>

              {/* Player Controls */}
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    prevSong();
                  }}
                  disabled={songs.length === 0}
                  className="w-12 h-12 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-pink-500 transition-colors flex items-center justify-center"
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    currentSong ? (isPlaying ? pauseSong() : resumeSong()) : songs.length > 0 ? playSong(0) : null;
                  }}
                  disabled={songs.length === 0}
                  className="w-16 h-16 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-pink-500 transition-colors flex items-center justify-center"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    nextSong();
                  }}
                  disabled={songs.length === 0}
                  className="w-12 h-12 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-pink-500 transition-colors flex items-center justify-center"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
                
                {/* Shuffle Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleShuffleMode();
                  }}
                  disabled={songs.length <= 1}
                  className={`w-12 h-12 border-2 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-cyan-400 transition-colors flex items-center justify-center ${
                  shuffleMode !== 'off' ? 'border-cyan-400' : 'border-gray-600'
                }`}
                  title={`Shuffle: ${shuffleMode === 'off' ? 'Off' : 'Mixed'}`}
                >
                   <Shuffle className={`w-6 h-6 ${shuffleMode !== 'off' ? 'animate-glow' : ''}`} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div
                  ref={progressBarRef}
                  onClick={seekTo}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="w-full h-3 bg-gray-600 cursor-pointer mb-2 rounded-full relative group"
                >
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 rounded-full transition-all duration-100 relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div 
                      className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ 
                        boxShadow: '0 0 10px rgba(255, 0, 255, 0.8)',
                        cursor: 'grab'
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-cyan-400">{formatTime(currentTime)}</span>
                  <span className="text-pink-500">{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Playlist Section */}
            <div ref={playlistRef} className="border-2 border-cyan-400 bg-black/30 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-cyan-400">My Playlist</h2>
              </div>

              {songs.length === 0 ? (
                <div className="text-center py-12 animate-fade-in">
                  <Music className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-xl text-gray-500">Your playlist is empty</p>
                  <p className="text-gray-400">Add some tracks to get started!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {songs.map((song, index) => (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === currentSongIndex ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            playSong(index);
                          }}
                        >
                          {index === currentSongIndex && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <p className="font-medium">{song.title}</p>
                          <p className="text-sm text-muted-foreground">{song.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedSong(song);
                            setIsPlaylistModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            deleteSong(song.id, song.url);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <PlaylistView />
        )}
      </main>

      {selectedSong && (
        <PlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => {
            setIsPlaylistModalOpen(false);
            setSelectedSong(null);
          }}
          currentSong={selectedSong}
        />
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        onUpload={handleUpload}
        defaultSongName={selectedFile?.name.replace(/\.[^/.]+$/, '') || ''}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* Footer */}
      <footer ref={footerRef} className="fixed bottom-0 left-0 right-0 bg-black/90 border-t-2 border-pink-500 p-4 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Volume Control */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Volume2 className="w-6 h-6 text-cyan-400 flex-shrink-0 animate-pulse" style={{ filter: 'drop-shadow(0 0 5px cyan)' }} />
            <div className="relative w-24">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #00ffff 0%, #00ffff ${volume * 100}%, #4a5568 ${volume * 100}%, #4a5568 100%)`
                }}
              />
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex flex-col items-center gap-4">
             {/* Connect With Us Text */}
             <h3 className="text-xl font-bold text-pink-500" style={{ textShadow: '0 0 5px #ff00ff' }}>Connect With Us</h3>
             <div className="flex items-center gap-6">
             <a 
               href="https://facebook.com" 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 hover:scale-110"
               style={{ filter: 'drop-shadow(0 0 8px cyan)' }}
             >
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
               </svg>
             </a>
             
             <a 
               href="https://instagram.com" 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black transition-all duration-300 hover:scale-110"
               style={{ filter: 'drop-shadow(0 0 8px #ff00ff)' }}
             >
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.33-1.297C4.23 14.97 3.885 13.407 3.885 12c0-1.407.345-2.97 1.234-3.691.882-.807 2.033-1.297 3.33-1.297 1.297 0 2.448.49 3.33 1.297.889.721 1.234 2.284 1.234 3.691 0 1.407-.345 2.97-1.234 3.691-.882.807-2.033 1.297-3.33 1.297z"/>
               </svg>
             </a>
             
             <a 
               href="https://youtube.com" 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all duration-300 hover:scale-110"
               style={{ filter: 'drop-shadow(0 0 8px #ff0000)' }}
             >
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
               </svg>
             </a>
             </div>

             {/* Copyright */}
             <div className="text-right min-w-0 flex-1">
               <p className="text-sm text-gray-400 font-['VT323']">
                 RetroTunes Player © 2025
               </p>
             </div>
           </div>
         </div>
       </footer>

      {/* Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00ffff;
          cursor: pointer;
          box-shadow: 0 0 10px #00ffff;
          border: 2px solid #fff;
          transition: all 0.3s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px #00ffff;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00ffff;
          cursor: pointer;
          box-shadow: 0 0 10px #00ffff;
          border: 2px solid #fff;
          transition: all 0.3s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px #00ffff;
        }

        @keyframes glow {
          0% { box-shadow: 0 0 5px #00ffff; }
          50% { box-shadow: 0 0 20px #00ffff; }
          100% { box-shadow: 0 0 5px #00ffff; }
        }

        .animate-glow {
          animation: glow 2s infinite;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeInUp 0.5s ease-out;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Add VT323 font styles */
        .font-vt323 {
          font-family: 'VT323', monospace;
        }

        /* Apply VT323 to specific elements */
        .text-2xl.font-bold {
          font-family: 'VT323', monospace;
        }

        .text-xl.font-bold {
          font-family: 'VT323', monospace;
        }

        .text-sm.font-mono {
          font-family: 'VT323', monospace;
        }

        .font-medium {
          font-family: 'VT323', monospace;
        }
      `}</style>
      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

const Index = () => {
  return (
    <PlaylistProvider>
      <IndexContent />
    </PlaylistProvider>
  );
};

export default Index;