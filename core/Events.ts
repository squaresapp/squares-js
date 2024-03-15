
declare namespace Raw
{
	interface EventMap extends HTMLElementEventMap
	{
		"squares:retract": CustomEvent<{ amount: number }>;
		"squares:enter": CustomEvent<{ selectedElement: HTMLElement; }>;
		"squares:exit": CustomEvent<{  }>;
		"squares:scrolledgecollision": CustomEvent<{ region: SquaresJS.EdgeCollisionRegion }>;
	}
}

namespace SquaresJS
{
	export type EdgeCollisionRegion = "top" | "bottom" | "top-exit" | "bottom-exit";
	
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
