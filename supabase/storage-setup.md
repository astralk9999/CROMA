# Supabase Storage Configuration

## Creating the Products Images Bucket

1. Go to your Supabase Dashboard → Storage
2. Click "New Bucket"
3. Configure the bucket:
   - **Name**: `product-images`
   - **Public bucket**: ✅ Check this (allows public read access to images)
   - **File size limit**: 5 MB (recommended for web-optimized images)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

## Storage Policies (Automatic with Public Bucket)

When you create a public bucket, Supabase automatically creates these policies:

### Public Read Access
- **Policy**: Anyone can view images
- **Operation**: SELECT
- **Target**: All users (anonymous and authenticated)

### Admin Write Access
You need to create a custom policy for uploads:

1. Go to Storage → product-images → Policies
2. Create new policy for INSERT:
   - **Policy name**: "Authenticated users can upload images"
   - **Policy definition**: 
   ```sql
   auth.role() = 'authenticated'
   ```
   - **Allowed operations**: INSERT

3. Create new policy for UPDATE:
   - **Policy name**: "Authenticated users can update images"
   - **Policy definition**: 
   ```sql
   auth.role() = 'authenticated'
   ```
   - **Allowed operations**: UPDATE

4. Create new policy for DELETE:
   - **Policy name**: "Authenticated users can delete images"
   - **Policy definition**: 
   ```sql
   auth.role() = 'authenticated'
   ```
   - **Allowed operations**: DELETE

## Folder Structure Recommendation

Store images with organized paths:
```
product-images/
├── products/
│   ├── {product-slug}/
│   │   ├── main.webp
│   │   ├── detail-1.webp
│   │   └── detail-2.webp
```

## Image Upload Path Example

When uploading from the admin panel:
```typescript
const filePath = `products/${productSlug}/${Date.now()}-${file.name}`;
```

## Getting Public URLs

After upload, get the public URL:
```typescript
const { data: { publicUrl } } = supabase
  .storage
  .from('product-images')
  .getPublicUrl(filePath);
```
