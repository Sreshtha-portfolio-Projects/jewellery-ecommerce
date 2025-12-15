# Supabase Storage Setup for Product Images

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the sidebar
3. Click **New bucket**
4. Create a bucket named: `product-images`
5. Set it as **Public bucket** (so images can be accessed via URL)
6. Click **Create bucket**

## Step 2: Set Up Bucket Policies

Run this SQL in Supabase SQL Editor:

```sql
-- Allow public read access to product-images bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users (admins) to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

## Step 3: Install Multer

```bash
cd backend
npm install multer
```

## Step 4: Test Upload

1. Go to Admin Panel → Products → Edit Product
2. Click "Upload File" button
3. Select an image file
4. Image should upload to Supabase Storage and appear in the product

## Notes

- File size limit: 5MB per image
- Supported formats: JPEG, JPG, PNG, WebP
- Images are stored in: `product-images/{productId}/{timestamp}-{random}.{ext}`
- Public URLs are automatically generated and saved to database

