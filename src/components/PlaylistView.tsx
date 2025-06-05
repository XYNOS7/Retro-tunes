import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Trash2, Music, SkipBack, SkipForward, ArrowLeft } from 'lucide-react';
import { usePlaylist } from '@/context/PlaylistContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { UploadModal } from './UploadModal';

export const PlaylistView: React.FC = () => {
  const { toast } = useToast();
  const {
    playlists,
    currentPlaylistId,
    setCurrentPlaylistId,
    currentSongIndex,
    setCurrentSongIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    audioRef,
    deletePlaylist,
    removeSongFromPlaylist,
    playSong,
    pauseSong,
    setCurrentTime
  } = usePlaylist();

  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPlaybackError, setIsPlaybackError] = useState(false);
  const [pendingPlayback, setPendingPlayback] = useState<{ playlistId: string; songIndex: number } | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const attemptPlayback = useCallback(async (playlistId: string, songIndex: number) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const song = playlist.songs[songIndex];
    if (!song) return;

    try {
      setIsPlaybackError(false);
      
      if (audioRef.current) {
        // Set the source and load the audio
        audioRef.current.src = song.url;
        audioRef.current.load();

        // Attempt to play
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          setPendingPlayback(null);
        } catch (playError) {
          console.error('Playback failed:', playError);
          setIsPlaybackError(true);
          setPendingPlayback({ playlistId, songIndex });
          toast({
            title: "Playback Error",
            description: "Please tap the play button again to start playback.",
            variant: "destructive"
          });
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error('Error handling song playback:', error);
      setIsPlaybackError(true);
      setPendingPlayback({ playlistId, songIndex });
      toast({
        title: "Error",
        description: "Failed to play song. Please try again.",
        variant: "destructive"
      });
      setIsPlaying(false);
    }
  }, [playlists, audioRef, setIsPlaying, toast]);

  const handlePlaySong = useCallback(async (playlistId: string, songIndex: number) => {
    if (currentPlaylistId === playlistId && currentSongIndex === songIndex) {
      if (isPlaying) {
        pauseSong();
      } else {
        // If there's a pending playback, attempt it
        if (pendingPlayback) {
          await attemptPlayback(pendingPlayback.playlistId, pendingPlayback.songIndex);
        } else {
          await attemptPlayback(playlistId, songIndex);
        }
      }
    } else {
      setCurrentPlaylistId(playlistId);
      setCurrentSongIndex(songIndex);
      await attemptPlayback(playlistId, songIndex);
    }
  }, [currentPlaylistId, currentSongIndex, isPlaying, pendingPlayback, setCurrentPlaylistId, setCurrentSongIndex, pauseSong, attemptPlayback]);

  const handleNextSong = useCallback(async () => {
    if (!currentPlaylistId) return;
    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (!playlist) return;

    const nextIndex = (currentSongIndex + 1) % playlist.songs.length;
    setCurrentSongIndex(nextIndex);
    await attemptPlayback(currentPlaylistId, nextIndex);
  }, [currentPlaylistId, currentSongIndex, playlists, setCurrentSongIndex, attemptPlayback]);

  const handlePrevSong = useCallback(async () => {
    if (!currentPlaylistId) return;
    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (!playlist) return;

    const prevIndex = (currentSongIndex - 1 + playlist.songs.length) % playlist.songs.length;
    setCurrentSongIndex(prevIndex);
    await attemptPlayback(currentPlaylistId, prevIndex);
  }, [currentPlaylistId, currentSongIndex, playlists, setCurrentSongIndex, attemptPlayback]);

  const handleDeletePlaylist = (playlistId: string) => {
    try {
      deletePlaylist(playlistId);
      toast({
        title: "Success",
        description: "Playlist deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive"
      });
    }
  };

  const handleRemoveSong = (playlistId: string, songId: string) => {
    try {
      removeSongFromPlaylist(playlistId, songId);
      toast({
        title: "Success",
        description: "Song removed from playlist"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove song from playlist",
        variant: "destructive"
      });
    }
  };

  const handleUpload = (songName: string, artistName: string) => {
    // TODO: Implement actual upload logic
    toast({
      title: "Success",
      description: "Song uploaded successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-pink-500 animate-pulse" />
          <p className="text-lg">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-pink-500/20">
        <div className="flex items-center gap-2">
          {currentPlaylistId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPlaylistId(null)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-xl font-bold text-pink-500">
            {currentPlaylistId 
              ? playlists.find(p => p.id === currentPlaylistId)?.name || 'Playlist'
              : 'Playlists'}
          </h2>
        </div>
      </div>

      {!currentPlaylistId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="border-2 border-cyan-400 bg-black/30 p-4 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setCurrentPlaylistId(playlist.id)}
            >
              <h3 className="text-xl font-bold text-cyan-400 mb-2">{playlist.name}</h3>
              <p className="text-sm text-gray-400">
                {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-pink-500 bg-black/30 p-4 md:p-6 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevSong}
                disabled={currentSongIndex <= 0}
                className="h-10 w-10 md:h-9 md:w-9"
              >
                <SkipBack className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextSong}
                disabled={currentSongIndex >= (playlists.find(p => p.id === currentPlaylistId)?.songs.length || 0) - 1}
                className="h-10 w-10 md:h-9 md:w-9"
              >
                <SkipForward className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDeletePlaylist(currentPlaylistId)}
                className="h-10 w-10 md:h-9 md:w-9"
              >
                <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          {playlists.find(p => p.id === currentPlaylistId)?.songs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-xl text-gray-500">This playlist is empty</p>
              <p className="text-gray-400">Add some songs to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.find(p => p.id === currentPlaylistId)?.songs.map((song, index) => (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-3 md:p-4 rounded-lg ${
                    index === currentSongIndex ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlaySong(currentPlaylistId, index)}
                      className={`h-10 w-10 md:h-9 md:w-9 flex-shrink-0 ${
                        isPlaybackError && index === currentSongIndex ? 'animate-pulse' : ''
                      }`}
                    >
                      {index === currentSongIndex && isPlaying ? (
                        <Pause className="h-5 w-5 md:h-4 md:w-4" />
                      ) : (
                        <Play className="h-5 w-5 md:h-4 md:w-4" />
                      )}
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{song.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:flex items-center gap-2 min-w-[200px]">
                      {index === currentSongIndex && (
                        <>
                          <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 rounded-full transition-all duration-100"
                              style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                          </div>
                          <div className="text-sm font-mono text-gray-400 min-w-[100px] text-right">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSong(currentPlaylistId, song.id)}
                      className="h-10 w-10 md:h-9 md:w-9 flex-shrink-0"
                    >
                      <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}; 