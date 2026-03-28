import { YOUTUBE_API_BASE } from './constants';

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration?: number;
}

export interface ParsedYouTubeInput {
  type: 'video' | 'playlist';
  id: string;
}

/**
 * Parse a YouTube URL or ID into a structured result.
 * Supports:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/playlist?list=PLAYLIST_ID
 *   - https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID (extracts playlist)
 *   - Plain video ID (11 chars)
 *   - Plain playlist ID (starts with PL, UU, etc.)
 */
export function parseYouTubeInput(input: string): ParsedYouTubeInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);

    // youtube.com/watch?v=xxx or youtube.com/watch?v=xxx&list=xxx
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtube-nocookie.com')) {
      const listId = url.searchParams.get('list');
      const videoId = url.searchParams.get('v');

      if (url.pathname === '/playlist' && listId) {
        return { type: 'playlist', id: listId };
      }
      // If both list and video exist, prefer playlist
      if (listId) {
        return { type: 'playlist', id: listId };
      }
      if (videoId) {
        return { type: 'video', id: videoId };
      }
    }

    // youtu.be/VIDEO_ID
    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1);
      const listId = url.searchParams.get('list');
      if (listId) {
        return { type: 'playlist', id: listId };
      }
      if (videoId) {
        return { type: 'video', id: videoId };
      }
    }
  } catch {
    // Not a URL — try as plain ID
  }

  // Plain playlist ID (typically starts with PL, UU, OL, etc. and is 24+ chars)
  if (/^(PL|UU|OL|FL|RD)[A-Za-z0-9_-]{10,}$/.test(trimmed)) {
    return { type: 'playlist', id: trimmed };
  }

  // Plain video ID (11 characters, base64-url safe)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return { type: 'video', id: trimmed };
  }

  return null;
}

/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds
 */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch details for a single YouTube video.
 */
export async function fetchVideoDetails(
  apiKey: string,
  videoId: string
): Promise<YouTubeVideoInfo> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `YouTube API error: ${res.status}`
    );
  }

  const data = await res.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const item = data.items[0];
  return {
    id: item.id,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url ||
      '',
    duration: item.contentDetails?.duration
      ? parseDuration(item.contentDetails.duration)
      : undefined,
  };
}

/**
 * Fetch all items from a YouTube playlist (paginated, up to 200).
 */
export async function fetchPlaylistItems(
  apiKey: string,
  playlistId: string
): Promise<YouTubeVideoInfo[]> {
  const items: YouTubeVideoInfo[] = [];
  let pageToken = '';
  let pages = 0;

  do {
    const tokenParam = pageToken ? `&pageToken=${pageToken}` : '';
    const res = await fetch(
      `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${tokenParam}`
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err?.error?.message || `YouTube API error: ${res.status}`
      );
    }

    const data = await res.json();

    for (const item of data.items || []) {
      const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      if (!videoId) continue;

      items.push({
        id: videoId,
        title: item.snippet?.title || 'Untitled',
        thumbnail:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
      });
    }

    pageToken = data.nextPageToken || '';
    pages++;
  } while (pageToken && pages < 4); // cap at ~200 items

  return items;
}
