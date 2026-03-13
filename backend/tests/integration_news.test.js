
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const API_URL = 'http://localhost:3001/api';

// Simple assertion helper
const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
};

async function runTests() {
  console.log('🚀 Starting News Upload Integration Tests...');

  // 1. Authenticate (Bypassed in Dev)
  console.log('\n--- Step 1: Admin Login (Bypassed in Dev) ---');
  // We don't need a token in dev mode as requireAdmin bypasses it
  const headers = {};

  // 2. Create News Item (Initial)
  console.log('\n--- Step 2: Create News Item ---');
  const newsData = { title: 'Test News', excerpt: 'Testing upload flow' };
  const createRes = await fetch(`${API_URL}/news`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(newsData)
  });
  
  assert(createRes.ok, `Create news failed: ${createRes.status}`);
  const createdNews = await createRes.json();
  const newsId = createdNews.id;
  assert(newsId, `News ID created: ${newsId}`);

  // 3. Upload Image
  console.log('\n--- Step 3: Upload Image ---');
  // Create a dummy image file
  const testImagePath = path.join(__dirname, 'test_image.png');
  // Create a simple 1x1 PNG buffer
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(testImagePath, pngBuffer);

  const formData = new FormData();
  const blob = new Blob([fs.readFileSync(testImagePath)], { type: 'image/png' });
  formData.append('file', blob, 'test_image.png');

  const uploadRes = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: headers, // fetch handles multipart boundary automatically if Content-Type is omitted
    body: formData
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text().catch(() => '');
    console.error(`❌ Upload failed: ${uploadRes.status} - ${errorText}`);
    process.exit(1);
  }
  
  assert(uploadRes.ok, `Upload successful: ${uploadRes.status}`);
  const uploadData = await uploadRes.json();
  const imageUrl = uploadData.url;
  assert(imageUrl, `Image URL returned: ${imageUrl}`);
  assert(imageUrl.startsWith('http'), 'Image URL is absolute');

  // 4. Update News with Image
  console.log('\n--- Step 4: Update News with Image ---');
  const updateRes = await fetch(`${API_URL}/news/${newsId}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...newsData, image: imageUrl })
  });

  assert(updateRes.ok, `Update news failed: ${updateRes.status}`);
  const updatedNews = await updateRes.json();
  assert(updatedNews.image === imageUrl, 'News image updated correctly');

  // 5. Verify Image Access
  console.log('\n--- Step 5: Verify Image Accessibility ---');
  const imgRes = await fetch(imageUrl);
  assert(imgRes.ok, `Image access failed: ${imgRes.status}`);
  const contentType = imgRes.headers.get('content-type');
  assert(contentType.includes('image'), `Content-Type correct: ${contentType}`);

  // 6. Test Rollback (Delete Image)
  console.log('\n--- Step 6: Test Rollback (Delete Image) ---');
  
  const deleteRes = await fetch(`${API_URL}/upload`, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl })
  });
  
  if (!deleteRes.ok) {
     const txt = await deleteRes.text();
     console.error(`Delete failed: ${deleteRes.status} - ${txt}`);
  }

  assert(deleteRes.ok, `Delete image failed: ${deleteRes.status}`);
  const verifyDel = await fetch(imageUrl);
  assert(verifyDel.status === 404, `Image should be gone: ${verifyDel.status}`);

  // 7. Cleanup
  console.log('\n--- Step 7: Cleanup ---');
  // Delete news item
  await fetch(`${API_URL}/news/${newsId}`, { method: 'DELETE', headers });
  // Clean up local test file
  fs.unlinkSync(testImagePath);
  
  console.log('\n🎉 All tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
