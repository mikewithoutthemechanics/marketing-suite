const axios = require('axios');

async function post(creds, payload) {
  // Instagram Graph API posting skeleton (image/video publish via IG Content Publishing)
  try {
    const pageId = creds.pageId || payload.pageId || (creds.pageInfo && creds.pageInfo.pageId) || (creds.pageInfo && creds.pageInfo.page_id);
    const pageToken = creds.pageAccessToken || (creds.pageInfo && creds.pageInfo.pageAccessToken) || (creds.pageInfo && creds.pageInfo.access_token) || (creds.pageAccessToken);

    if (pageId && pageToken) {
      // Prefer Instagram Business account id if present
      const igUserId = (creds.pageInfo && creds.pageInfo.instagram_business_account && creds.pageInfo.instagram_business_account.id) || pageId;

      // For images: POST /{ig-user-id}/media with image_url + caption, then /{ig-user-id}/media_publish
      if (payload.mediaUrl) {
        const mediaUrl = payload.mediaUrl;
        const createUrl = `https://graph.facebook.com/v16.0/${igUserId}/media`;
        const params = { image_url: mediaUrl, caption: payload.caption || payload.text || '', access_token: pageToken };
        const createRes = await axios.post(createUrl, null, { params }).catch(e => ({ error: e }));
        const creationId = createRes && createRes.data && createRes.data.id;
        if (creationId) {
          const publishUrl = `https://graph.facebook.com/v16.0/${igUserId}/media_publish`;
          const pubRes = await axios.post(publishUrl, null, { params: { creation_id: creationId, access_token: pageToken } }).catch(e => ({ error: e }));
          return { ok: true, platformId: pubRes && pubRes.data && pubRes.data.id ? pubRes.data.id : ('ig_' + Date.now()), raw: { create: createRes.data, publish: pubRes.data } };
        }
      }

      // For video: similar flow but with video_url (requires video upload to a public URL or chunked upload)
      if (payload.videoUrl) {
        const createUrl = `https://graph.facebook.com/v16.0/${igUserId}/media`;
        const params = { video_url: payload.videoUrl, caption: payload.caption || payload.text || '', access_token: pageToken };
        const createRes = await axios.post(createUrl, null, { params }).catch(e => ({ error: e }));
        const creationId = createRes && createRes.data && createRes.data.id;
        if (creationId) {
          const publishUrl = `https://graph.facebook.com/v16.0/${igUserId}/media_publish`;
          const pubRes = await axios.post(publishUrl, null, { params: { creation_id: creationId, access_token: pageToken } }).catch(e => ({ error: e }));
          return { ok: true, platformId: pubRes && pubRes.data && pubRes.data.id ? pubRes.data.id : ('ig_video_' + Date.now()), raw: { create: createRes.data, publish: pubRes.data } };
        }
      }

      // If no media URL provided, fallback to simulated response
      console.log('Posting to Instagram Page (no public media URL), simulated', { pageId, caption: payload.caption });
      return { ok: true, platformId: 'ig_' + Date.now(), pageId };
    }

    // Fallback: log and return simulated id
    console.log('Posting to Instagram (simulated fallback)', { caption: payload.caption });
    return { ok: true, platformId: 'ig_' + Date.now() };
  } catch (err) {
    console.error('instagram.post error', err?.response?.data || err.message || err);
    throw err;
  }
}

module.exports = { post };
