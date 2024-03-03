
declare namespace Raw
{
	interface EventMap extends HTMLElementEventMap
	{
		"squares:disconnect": Event;
		"squares:retract": CustomEvent<{ amount: number }>;
		"squares:posterselected": CustomEvent<{ poster: HTMLElement; }>;
	}
}

namespace SquaresJS
{
	/**
	 * Provides a way to dispatch a bubbling CustomEvent
	 * object with type-safe .details property, using a custom
	 * .details argument. The details argument is returned,
	 * possibly after being modified by the event handlers.
	 */
	export function dispatch<K extends keyof Raw.EventMap>(
		target: HTMLElement | { readonly head: Element },
		name: K,
		detail: Raw.EventMap[K] extends CustomEvent<infer T> ? T : {}): Raw.EventMap[K] extends CustomEvent<infer T> ? T : {};
	/**
	 * Provides a way to dispatch a bubbling CustomEvent
	 * object with type-safe .details property.
	 */
	export function dispatch<K extends keyof Raw.EventMap>(
		target: HTMLElement | { readonly head: Element },
		name: K): void;
	/**
	 * Provides a way to dispatch a bubbling CustomEvent
	 * object with type-safe .details property.
	 */
	export function dispatch<K extends keyof Raw.EventMap>(
		target: HTMLElement | { readonly head: Element },
		name: K,
		detail?: Raw.EventMap[K] extends CustomEvent<infer T> ? T : {})
	{
		const ev = new CustomEvent<any>(name, { bubbles: true, detail });
		(Raw.is.element(target) ? target : target.head).dispatchEvent(ev);
		return detail;
	}
}
