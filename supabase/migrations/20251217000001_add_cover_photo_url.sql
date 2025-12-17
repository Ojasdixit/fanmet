-- Add cover_photo_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.cover_photo_url IS 'URL to the user''s cover photo (stored in Cloudinary)';
