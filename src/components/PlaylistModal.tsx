import React, { useState } from 'react';
import { X, Plus, Music } from 'lucide-react';
import { usePlaylist } from '@/context/PlaylistContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: {
    id: string;
    title: string;
    artist: string;
    url: string;
  };
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  currentSong,
}) => {
  const { toast } = useToast();
  const { playlists, createPlaylist, addSongToPlaylist, isSongInPlaylist } = usePlaylist();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      toast({
        title: "Success",
        description: "Playlist created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePlaylistSelect = (playlistId: string) => {
    setSelectedPlaylists(prev => {
      if (prev.includes(playlistId)) {
        return prev.filter(id => id !== playlistId);
      }
      return [...prev, playlistId];
    });
  };

  const handleConfirm = () => {
    selectedPlaylists.forEach(playlistId => {
      if (!isSongInPlaylist(playlistId, currentSong.id)) {
        addSongToPlaylist(playlistId, currentSong);
      }
    });

    toast({
      title: "Success",
      description: "Song added to selected playlists"
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border-2 border-pink-500 rounded-lg p-6 w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-pink-500 mb-6">Add to Playlist</h2>

        {/* Create New Playlist */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Create New Playlist</h3>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleCreatePlaylist}
              disabled={isCreating}
              className="bg-pink-500 hover:bg-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </div>

        {/* Existing Playlists */}
        <div>
          <h3 className="text-lg font-medium mb-2">Add to Existing Playlist</h3>
          {playlists.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Music className="h-12 w-12 mx-auto mb-2" />
              <p>No playlists yet</p>
              <p className="text-sm">Create your first playlist above</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {playlists.map((playlist) => {
                const isSongAlreadyAdded = isSongInPlaylist(playlist.id, currentSong.id);
                return (
                  <div
                    key={playlist.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPlaylists.includes(playlist.id)}
                        onChange={() => handlePlaylistSelect(playlist.id)}
                        disabled={isSongAlreadyAdded}
                        className="w-4 h-4 rounded border-pink-500 text-pink-500 focus:ring-pink-500"
                      />
                      <span className={isSongAlreadyAdded ? "text-gray-500" : ""}>
                        {playlist.name}
                      </span>
                    </div>
                    {isSongAlreadyAdded && (
                      <span className="text-sm text-gray-500">Already added</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleConfirm}
            disabled={selectedPlaylists.length === 0}
            className="bg-pink-500 hover:bg-pink-600"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}; 