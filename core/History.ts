
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
			const marker: IHistoryMarker = { index };
			history.pushState(marker, "", path);
		}
	}
}
