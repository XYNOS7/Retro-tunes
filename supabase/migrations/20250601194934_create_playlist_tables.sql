-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create playlist_songs table
CREATE TABLE IF NOT EXISTS playlist_songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    song_title TEXT NOT NULL,
    song_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(playlist_id, song_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_song_id ON playlist_songs(song_id);

-- Enable Row Level Security (RLS)
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on playlists" ON playlists
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on playlist_songs" ON playlist_songs
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on playlists" ON playlists
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access on playlist_songs" ON playlist_songs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access on playlists" ON playlists
    FOR DELETE USING (true);

CREATE POLICY "Allow public delete access on playlist_songs" ON playlist_songs
    FOR DELETE USING (true);
