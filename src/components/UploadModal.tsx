import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (songName: string, artistName: string) => void;
  defaultSongName?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  defaultSongName = '',
  isUploading = false,
  uploadProgress = 0
}) => {
  const [songName, setSongName] = useState(defaultSongName);
  const [artistName, setArtistName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songName.trim()) return;
    onUpload(songName.trim(), artistName.trim() || 'Unknown Artist');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Song Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="songName">Song Name *</Label>
            <Input
              id="songName"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              placeholder="Enter song name"
              required
              disabled={isUploading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artistName">Artist Name</Label>
            <Input
              id="artistName"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Enter artist name (optional)"
              disabled={isUploading}
            />
          </div>
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!songName.trim() || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 