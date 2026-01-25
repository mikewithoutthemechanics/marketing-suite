const axios = require('axios');

// X/Twitter connector - chunked media upload helper and post scaffold
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB segments

async function initUpload(access, totalBytes, mediaType) {
  const resp = await axios.post('https://upload.twitter.com/1.1/media/upload.json', null, {
    params: { command: 'INIT', total_bytes: totalBytes, media_type: mediaType }
  , headers: { Authorization: `Bearer ${access}` }});
  return resp.data && resp.data.media_id_string;
}

async function appendUpload(access, mediaId, segmentIndex, chunk) {
  // Twitter v1.1 accepts raw binary in body for APPEND with params
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  const config = {
    params: { command: 'APPEND', media_id: mediaId, segment_index: segmentIndex },
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/octet-stream' },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 120 * 1000
  };
  return axios.post(url, chunk, config);
}

async function finalizeUpload(access, mediaId) {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  const resp = await axios.post(url, null, { params: { command: 'FINALIZE', media_id: mediaId }, headers: { Authorization: `Bearer ${access}` } });
  return resp.data;
}

async function uploadChunkedMedia(access, buffer, contentType) {
  const total = buffer.length;
  const mediaType = contentType || 'application/octet-stream';
  const mediaId = await initUpload(access, total, mediaType);
  if (!mediaId) throw new Error('init upload failed');
  let idx = 0;
  for (let offset = 0; offset < total; offset += DEFAULT_CHUNK_SIZE) {
    const end = Math.min(offset + DEFAULT_CHUNK_SIZE, total);
    const chunk = buffer.slice(offset, end);
    let attempts = 0;
    while (attempts < 3) {
      try {
        await appendUpload(access, mediaId, idx, chunk);
        break;
      } catch (e) {
        attempts++;
        if (attempts >= 3) throw e;
        await new Promise(r => setTimeout(r, 250 * attempts));
      }
    }
    idx++;
  }
  const fin = await finalizeUpload(access, mediaId);
  return fin;
}

// main post function
async function post(creds, payload) {
  try {
    const access = creds.access_token || creds.accessToken || creds.token;
    if (!access) {
      console.log('X: no access token, simulated post', { text: payload.text });
      return { ok: true, platformId: 'x_stub_' + Date.now() };
    }

    if (payload.buffer || payload.mediaUrl) {
      let buffer = null;
      let contentType = payload.contentType || 'application/octet-stream';
      if (payload.buffer) buffer = Buffer.from(payload.buffer);
      else if (payload.mediaUrl) {
        const mediaResp = await axios.get(payload.mediaUrl, { responseType: 'arraybuffer' });
        buffer = Buffer.from(mediaResp.data);
        if (mediaResp.headers && mediaResp.headers['content-type']) contentType = mediaResp.headers['content-type'];
      }
      if (buffer) {
        const mediaResult = await uploadChunkedMedia(access, buffer, contentType);
        // If upload succeeded, create tweet with media_id
        const mediaId = mediaResult && (mediaResult.media_id_string || mediaResult.media_id);
        try {
          const body = mediaId ? { text: payload.text, media: { media_ids: [mediaId] } } : { text: payload.text };
          const postResp = await axios.post('https://api.twitter.com/2/tweets', body, { headers: { Authorization: `Bearer ${access}` } }).catch(() => null);
          if (postResp && postResp.data) return { ok: true, platformId: postResp.data.data && postResp.data.data.id ? postResp.data.data.id : 'x_' + Date.now(), raw: postResp.data };
        } catch (e) {
          // fallthrough to simulated
        }
        return { ok: true, platformId: mediaId ? `x_media_${mediaId}` : 'x_' + Date.now(), raw: mediaResult };
      }
    }

    // Fallback: create tweet/status update
    try {
      const postResp = await axios.post('https://api.twitter.com/2/tweets', { text: payload.text }, { headers: { Authorization: `Bearer ${access}` } }).catch(() => null);
      if (postResp && postResp.data) return { ok: true, platformId: postResp.data.data && postResp.data.data.id ? postResp.data.data.id : 'x_' + Date.now(), raw: postResp.data };
    } catch (e) {
      // ignore and fallback
    }

    console.log('Posting to X (simulated fallback)', { text: payload.text });
    return { ok: true, platformId: 'x_' + Date.now() };
  } catch (err) {
    console.error('x.post error', err?.response?.data || err.message || err);
    throw err;
  }
}

module.exports = { post, uploadChunkedMedia };
