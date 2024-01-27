
namespace SquaresJS
{
	/**
	 * Creates an element that has pull-to-refresh capabilities.
	 */
	export class Puller
	{
		readonly head;
		
		/** */
		constructor(...params: Raw.Param[])
		{
			
			this.head = raw.div(
				"squares-js-puller",
				{
					overflowY: "auto",
				},
				noScrollBars(),
				raw.on("wheel", ev =>
				{
					//ev.preventDefault();
				}),
				params
			);
		}
	}
}
