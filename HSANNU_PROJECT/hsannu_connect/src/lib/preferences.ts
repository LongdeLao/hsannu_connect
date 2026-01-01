export type DateInputMode = "default" | "nlp"

const DATE_MODE_KEY = "date-input-mode"

export function getDateInputMode(defaultMode: DateInputMode = "default"): DateInputMode {
	if (typeof window === "undefined") return defaultMode
	try {
		const v = localStorage.getItem(DATE_MODE_KEY)
		if (v === "default" || v === "nlp") return v
		return defaultMode
	} catch {
		return defaultMode
	}
}

export function setDateInputMode(mode: DateInputMode): void {
	if (typeof window === "undefined") return
	try {
		localStorage.setItem(DATE_MODE_KEY, mode)
	} catch {}
} 