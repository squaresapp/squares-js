
/** @internal */
namespace SquaresJS
{
	/** */
	export function getSizeClass(e: HTMLElement)
	{
		for (let i = -1; ++i < e.classList.length;)
		{
			const cls = e.classList.item(i) || "";
			if (cls.startsWith(sizeClassPrefix))
				return Number(cls.slice(sizeClassPrefix.length));
		}
		
		return -1;
	}
	
	/** */
	export function getSizeClasses()
	{
		const sizeClasses = new Map<number, string>();
		
		for (let size = +Const.sizeMin; size <= +Const.sizeMax; size++)
		{
			const params: (string | Raw.Style)[] = [];
			const scale = 1 / size;
			const sizeClass = "size-" + size;
			sizeClasses.set(size, sizeClass);
			
			params.push(
				"." + sizeClass, {
					[Const.sizeVar]: size
				} as any
			);
			
			for (let n = -1; ++n < size;)
			{
				params.push(
					` .${sizeClass} > DIV:nth-of-type(${size}n + ${n + 1})`, {
						left: (scale * 100 * n) + "%",
						transform: `scale(${scale.toFixed(4)})`,
						transformOrigin: "0 0",
					}
				);
			}
			
			raw.style(...params).attach();
		}
		
		SquaresJS.getSizeClasses = () => sizeClasses;
		return sizeClasses;
	}
	
	const sizeClassPrefix = "size-";
	
	/**
	 * @internal
	 * Observes the resizing of the particular element, and invokes
	 * the specified callback when the element is resized.
	 */
	export function watchResize(
		e: HTMLElement,
		callback: (width: number, height: number) => void,
		runInitially: boolean = false)
	{
		if (typeof ResizeObserver !== "undefined")
		{
			new ResizeObserver(rec =>
			{
				if (rec.length === 0)
					return;
				
				const entry = rec[0];
				if (entry.borderBoxSize?.length > 0)
				{
					const size = entry.borderBoxSize[0];
					callback(size.inlineSize, size.blockSize);
				}
				else
				{
					const width = e.offsetWidth;
					const height = e.offsetHeight;
					callback(width, height);
				}
			}).observe(e, { box: "border-box" });
		}
		else raw.get(e)(raw.on(window, "resize", () =>
		{
			window.requestAnimationFrame(() =>
			{
				const width = e.offsetWidth;
				const height = e.offsetHeight;
				callback(width, height);
			});
		}));
		
		if (runInitially)
		{
			const exec = () => callback(e.offsetWidth, e.offsetHeight);
			
			if (e.isConnected)
				exec();
			else
				raw.get(e)(raw.on("connected", exec));
		}
	}
	
	/** */
	export function getByClass(cls: string, element?: Element)
	{
		const col = (element || document).getElementsByClassName(cls);
		return Array.from(col) as HTMLElement[];
	}
	
	/** */
	export function getByIndex(index: number)
	{
		return document.getElementsByClassName(indexPrefix + index).item(0) as HTMLElement | null;
	}
	
	/** */
	export function getIndex(e: Element)
	{
		return Number((Array.from(e.classList)
			.find(cls => cls.startsWith(indexPrefix)) || "")
			.slice(indexPrefix.length)) || 0;
	}
	
	/** */
	export function setIndex(e: Element, index: number)
	{
		e.classList.add(indexPrefix + index);
	}
	
	/** */
	export function hasIndex(e: Element)
	{
		return Array.from(e.classList).some(cls => cls.startsWith(indexPrefix));
	}
	
	const indexPrefix = "index:";
	
	/** */
	export const showClass = raw.css({
		display: "block !",
	});
	
	/** */
	export function wait(ms = 0)
	{
		return new Promise(r => setTimeout(r, ms));
	}
	
	/** */
	export async function waitTransitionEnd(e: Element)
	{
		await new Promise<void>(r => e.addEventListener("transitionend", ev =>
		{
			if (ev.target === e)
				r();
		}));
	}
	
	/** @internal */
	export const enum Const
	{
		poster = "poster",
		//body = "body",
		hasCssTop = "has-top",
		
		sizeVar = "--size",
		sizeMin = 2,
		sizeMax = 7,
	}
	
	/** @internal */
	export const unselectable: Raw.Style = {
		userSelect: "none",
		webkitUserSelect: "none",
	};
	
	/** @internal */
	export const stretch: Raw.Style = {
		width: ["-moz-available", "-webkit-fill-available", "fill-available", "stretch"],
	};
	
	/** */
	export const clickable: Raw.Style = {
		...unselectable,
		cursor: "pointer"
	} as const;
	
	/** */
	export const noScrollBars = () => raw.style(
		"*::-webkit-scrollbar", {
			display: "none"
		}
	);
}
