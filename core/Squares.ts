
namespace SquaresJS
{
	/**
	 * 
	 */
	export interface IGridOptions
	{
		/**
		 * Specifies the path to display in the address bar when the
		 * grid has the focus (as opposed to a page).
		 */
		readonly gridPath?: string;
		
		/**
		 * Defines the ratio of the height of the poster to its width.
		 * Defaults to a value of 1 (square).
		 */
		readonly posterHeightRatio?: number;
		
		/**
		 * Specifies the total number of posters available
		 * in the supplied stream. This is used to inform the
		 * rendered when to cut off fetching new posters.
		 */
		readonly maxPosterCount?: number;
		
		/**
		 * 
		 */
		readonly anchorPosterIndex?: number;
		
		/**
		 * Stores the element where the viewport is rendered.
		 */
		readonly viewportElement?: HTMLElement;
		
		/**
		 * Used to supply the UI that displays in place of a poster
		 * if there is a delay between the time that requestPoster()
		 * is called, and a poster element is returned.
		 */
		requestPlaceholder(): HTMLElement;
		
		/**
		 * 
		 */
		requestPoster(position: number): Promise<HTMLElement> | HTMLElement | null;
		
		/**
		 * Used to supply the sections that make up a page
		 * that gets clicked on in the grid.
		 */
		requestPage(
			selectedElement: HTMLElement,
			selectedIndex: number): {
				sections: HTMLElement[];
				path: string;
			}
	}
	
	/** */
	export class Squares
	{
		readonly head: HTMLElement;
		
		/** */
		constructor(private readonly options: IGridOptions)
		{
			this.head = raw.div(
				"squares-js-squares",
				{
					width: "-webkit-fill-available",
					height: "100%",
					backgroundColor: "transparent",
				},
				this.grid = new Grid(options),
				raw.on("connected", () =>
				{
					// This should only be called when starting at the grid.
					// If we're starting at a page, we need to replace state
					// with the page index
					History.push(IHistoryMarker.gridIndex, options.gridPath || "/");
				}),
				raw.on("squares:posterselected", ev =>
				{
					const path = this.showPage(ev.detail.poster);
					const index = getIndex(ev.detail.poster);
					History.push(index, path);
				}),
				raw.on(window, "popstate", ev =>
				{
					if (!IHistoryMarker.is(ev.state))
						return;
					
					if (ev.state.index === IHistoryMarker.gridIndex)
						return this.page?.retract();
					
					const e = getByIndex(ev.state.index);
					if (e)
						this.showPage(e);
				})
			);
		}
		
		/** */
		readonly grid;
		
		/** */
		get page()
		{
			return this._page;
		}
		private _page: Page | null = null;
		
		/** */
		private showPage(selectedPoster: HTMLElement)
		{
			const index = getIndex(selectedPoster);
			const { sections, path } = this.options.requestPage(selectedPoster, index);
			
			const page = raw.get(new Page(sections))(
				{
					position: "absolute",
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					transitionDuration,
					transitionProperty: "transform",
					transform: "translateY(110%) " + translateZ(translateZMax + "px"),
				},
				raw.on("connected", () =>
				{
					setTimeout(async () =>
					{
						page.head.style.transform = "translateY(0) " + translateZ("0px");
						await waitTransitionEnd(page.head);
						
						// Fixes a screwy bug on Safari that causes the grid to not 
						// render. Apparently setting a background color on the page
						// fixes this.
						await wait(1000);
						page.head.style.backgroundColor = "rgba(0, 0, 0, 0.01)";
						this.head.style.backgroundColor = "rgba(0, 0, 0, 0.01)";
						this.grid.head.style.backgroundColor = "rgba(0, 0, 0, 0.01)";
						await wait(200);
					});
					
					setTimeout(async () =>
					{
						for (let e = this.grid.head.parentElement; e; e = e.parentElement)
							e.classList.add(noOverflowClass);
						
						const s = this.grid.head.style;
						s.transitionDuration = transitionDuration;
						s.transform = translateZ(0 + "px");
						s.opacity = "1";
						await wait(1);
						s.transform = translateZ(translateZMax + "px");
						s.opacity = "0";
					});
				}),
				raw.on(this.grid.head, "scroll", async () =>
				{
					if (page.head.isConnected)
						await page.retract("panic");
				}),
				raw.on("squares:retract", ev =>
				{
					const pct = ev.detail.amount;
					const s = this.grid.head.style;
					s.transitionDuration = "0s";
					s.transform = translateZ(pct * translateZMax + "px");
					const opacity = 1 - pct;
					s.opacity = (opacity > 0.99 ? 1 : opacity).toString();
				}),
				raw.on("squares:disconnect", () =>
				{
					this.grid.head.style.transitionDuration = transitionDuration;
					
					for (let e = this.grid.head.parentElement; e; e = e.parentElement)
						e.classList.remove(noOverflowClass);
					
					History.push(IHistoryMarker.gridIndex, this.options.gridPath || "/");
				})
			);
			
			this.grid.head.after(page.head);
			this._page = page;
			return path;
		}
	}
	
	const transitionDuration = "0.5s";
	const translateZ = (amount: string) => `perspective(10px) translateZ(${amount})`;
	const translateZMax = -3;
	
	const noOverflowClass = raw.css({
		overflow: "hidden !"
	});
}
