
namespace SquaresJS
{
	/** */
	export interface IHistoryMarker
	{
		index: number;
	}
	
	/** */
	export namespace IHistoryMarker
	{
		/** */
		export function is(a: any): a is IHistoryMarker
		{
			return !!a && typeof a === "object" && typeof a.index === "number"
		}
		
		/** */
		export const gridIndex = -1;
	}
	
	/** */
	export namespace History
	{
		/** */
		export function push(index: number, path: string)
		{
			// Don't allow full foreign URLs to be used as a path.
			let url: URL | null = null;
			
			try
			{
				url = new URL(path);
			}
			catch (e) { }
			
			if (url)
			{
				const lo = window.location;
				if (lo.hostname !== url.hostname || lo.protocol !== url.protocol)
					path = "#" + path;
			}
			
			const marker: IHistoryMarker = { index };
			history.pushState(marker, "", path);
		}
	}
}
