export function getCachedAvatarDataUrl(userId: string): string | null {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null
	try {
		const raw = localStorage.getItem(`avatar_cache_v1_${userId}`)
		if (!raw) return null
		const obj = JSON.parse(raw) as { dataUrl?: string; ts?: number; src?: string }
		if (!obj?.dataUrl || !obj?.ts) return null
		const maxAgeMs = 7 * 24 * 60 * 60 * 1000 // 7 days
		if (Date.now() - obj.ts > maxAgeMs) return null
		return obj.dataUrl
	} catch {
		return null
	}
}

export async function cacheAvatarDataUrl(userId: string, url: string): Promise<void> {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
	try {
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), 8000)
		const resp = await fetch(url, { cache: 'force-cache', signal: controller.signal })
		clearTimeout(timeout)
		if (!resp.ok) return
		const blob = await resp.blob()
		const dataUrl = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader()
			reader.onloadend = () => resolve(String(reader.result))
			reader.onerror = () => reject(new Error('Failed to read avatar blob'))
			reader.readAsDataURL(blob)
		})
		localStorage.setItem(
			`avatar_cache_v1_${userId}`,
			JSON.stringify({ dataUrl, ts: Date.now(), src: url })
		)
	} catch {
		// no-op on failures
	}
}

export function clearAvatarCache(userId: string): void {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
	try { localStorage.removeItem(`avatar_cache_v1_${userId}`) } catch { /* no-op */ }
} 