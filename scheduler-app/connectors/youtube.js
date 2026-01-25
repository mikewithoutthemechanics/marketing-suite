const axios = require('axios');

// YouTube connector - cleaned up with a resumable upload helper (scaffold)
// Note: This is a best-effort helper. For production, consider using the official Google APIs client.

const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB

async function initResumableUpload(accessToken, metadata) {
  const initUrl = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';
  const resp = await axios.post(initUrl, metadata, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  });
  return resp.headers && resp.headers.location;
}

async function uploadResumable(uploadUrl, buffer, contentType, chunkSize = DEFAULT_CHUNK_SIZE) {
  // Upload in chunks with simple retry logic
  const total = buffer.length;
  let offset = 0;
  let attempt = 0;
  while (offset < total) {
    const end = Math.min(offset + chunkSize, total) - 1;
    const chunk = buffer.slice(offset, end + 1);
    const contentRange = `bytes ${offset}-${end}/${total}`;
    attempt = 0;
    while (attempt < 3) {
      try {
        const r = await axios.put(uploadUrl, chunk, {
          headers: {
            'Content-Type': contentType || 'application/octet-stream',
            'Content-Range': contentRange
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 60 * 1000
        });
        // If server returns 308 Resume Incomplete, continue; if 200/201, upload complete
        if (r.status === 200 || r.status === 201) return r.data;
        if (r.status === 308 || r.status === 202) break; // continue to next chunk
        break;
      } catch (err) {
        attempt++;
        if (attempt >= 3) throw err;
        await new Promise(res => setTimeout(res, 500 * attempt));
      }
    }
    offset = end + 1;
  }
  // Finalize: some APIs return resource in last chunk response; otherwise return minimal info
  return { ok: true };
}

async function post(creds, payload) {
  try {
    const access = creds.access_token || creds.accessToken || creds.token;
    if (!access) {
      console.log('YouTube: no access token, simulated post', { title: payload.title });
      return { ok: true, platformId: 'yt_stub_' + Date.now() };
    }

    const metadata = {
      snippet: {
        title: payload.title || 'Untitled',
        description: payload.text || payload.caption || '',
        tags: payload.tags || []
      },
      status: { privacyStatus: payload.privacy || 'private' }
    };

    const uploadUrl = await initResumableUpload(access, metadata);
    if (!uploadUrl) return { ok: false, error: 'failed to initialize resumable upload' };

    // Accept payload.buffer (Buffer) or payload.mediaUrl
    let buffer = null;
    let contentType = payload.contentType || 'application/octet-stream';
    if (payload.buffer) {
      buffer = Buffer.from(payload.buffer);
    } else if (payload.mediaUrl) {
      const mediaResp = await axios.get(payload.mediaUrl, { responseType: 'arraybuffer' });
      buffer = Buffer.from(mediaResp.data);
      if (mediaResp.headers && mediaResp.headers['content-type']) contentType = mediaResp.headers['content-type'];
    }

    if (!buffer) {
      // metadata-only upload
      return { ok: true, platformId: 'yt_meta_' + Date.now(), metadata };
    }

    const result = await uploadResumable(uploadUrl, buffer, contentType);
    return { ok: true, platformId: result && result.id ? result.id : 'yt_' + Date.now(), raw: result };
  } catch (err) {
    console.error('youtube.post error', err?.response?.data || err.message || err);
    throw err;
  }
}

module.exports = { post, uploadResumable };
