
namespace SquaresJS
{
	/**
	 * 
	 */
	export class Grid
	{
		/** */
		readonly head: HTMLElement;
		
		/** */
		private readonly postersElement;
		
		/** */
		private headerCssHeight = "";
		
		/** */
		constructor(readonly options: IGridOptions)
		{
			this.maxPosterCount = options.maxPosterCount || 0;
			this.headerCssHeight = options.headerElement?.style.height || "";
			
			this.head = raw.div(
				"squares-js-grid",
				unselectable,
				{
					position: "relative",
					minHeight: "100%",
					overflowY: "auto",
				},
				raw.on("scroll", () =>
				{
					this.maybeRedraw(true);
				}),
				options.headerElement && raw.get(options.headerElement)(
					{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
					}
				),
				this.postersElement = raw.div(
					"squares-js-posters",
					{
						position: "absolute",
						left: 0,
						right: 0,
					},
					raw.css("> ." + Const.poster, {
						display: "none",
						position: "absolute",
						width: "100%",
						height: "100%",
						overflow: "hidden",
						...clickable,
					}),
					raw.on("connected", () =>
					{
						const e = options.headerElement;
						if (e && !this.headerCssHeight)
							this.headerCssHeight = getComputedStyle(e).getPropertyValue("height");
						
						this.updatePostersElementSize();
						this._width = this.head.offsetWidth;
						this._height = this.head.offsetHeight;
						this.updateSize();
						this.maybeFetch(2);
						
						watchResize(this.head, (w, h) =>
						{
							this.updateSize(-1);
							[this._width, this._height] = [w, h];
							this.maybeRedraw();
						});
					})
				)
			);
		}
		
		/**
		 * Extends the number of posters that can be displayed in the UI.
		 * Used to implement refresh functionality.
		 */
		extendPosterCount(newPosterCount: number)
		{
			if (newPosterCount > this.maxPosterCount)
			{
				this.maxPosterCount = newPosterCount;
				this.maybeFetch(2);
			}
		}
		
		private maxPosterCount = 0;
		
		/** */
		private get heightRatio()
		{
			return this.options.posterHeightRatio || 1;
		}
		
		/** */
		private get viewportElement()
		{
			const e = this.options.viewportElement || this.head.parentElement;
			if (!e)
				throw new Error();
			
			return e;
		}
		
		/**
		 * Gets the pixel width of the head element.
		 */
		get width()
		{
			return this._width;
		}
		private _width = 0;
		
		/**
		 * Gets the pixel height of the head element.
		 */
		get height()
		{
			return this._height;
		}
		private _height = 0;
		
		/**
		 * Gets or sets the number of posters to display in the horizontal axis
		 */
		get size()
		{
			return getSizeClass(this.postersElement);
		}
		set size(size: number)
		{
			this.updateSize(size);
		}
		
		/** */
		private updateSize(size = this.size)
		{
			if (size <= 0)
				size = this.calculateAutoSize();
			
			size = Math.min(Const.sizeMax, Math.max(0, size));
			
			if (size > 0 && size < Const.sizeMin)
				size = Const.sizeMin;
			
			if (size === this.size)
				return;
			
			const classes = getSizeClasses();
			const sizeClass = classes.get(size);
			if (!sizeClass)
				return;
			
			this.postersElement.classList.remove(...classes.values());
			this.postersElement.classList.add(sizeClass);
			this.updatePostersElementSize();
			this.maybeRedraw();
		}
		
		/**
		 * Sets the height of the posters element using the CSS padding-top trick.
		 * The purpose of the posters element is to provide a way to set the top
		 * value of the posters to a fixed amount that doesn't need to change for 
		 * every poster when the screen resizes (this can only be done with a CSS %
		 * unit).
		 */
		private updatePostersElementSize()
		{
			this.postersElement.style.paddingTop = (100 * this.heightRatio) + "%";
		}
		
		/**
		 * Calculates a comfortable number of posters to display in the
		 * horizontal direction, given the dimensions of the container,
		 * and the pixel density of the device.
		 */
		private calculateAutoSize()
		{
			const isTouch = window.matchMedia("(pointer: coarse)").matches;
			const width = this.viewportElement.offsetWidth;
			
			return isTouch ?
				Math.max(3, Math.floor(width / 140)) :
				Math.max(2, Math.round(width / 250));
		}
		
		/**
		 * Gets the number of posters that currently exist within the DOM.
		 */
		get posterCount()
		{
			return this.postersElement.getElementsByClassName(Const.poster).length;
		}
		
		/** */
		private maybeFetch(screenCount: number)
		{
			const maybePromises: ReturnType<IGridOptions["requestPoster"]>[] = [];
			const pullCount = this.size * this.size * screenCount;
			const rangeStart = this.posterCount;
			let rangeEnd = rangeStart + pullCount;
			let canContinue = true;
			
			if (this.maxPosterCount)
				rangeEnd = Math.min(this.maxPosterCount, rangeEnd);
			
			for (let i = rangeStart; i < rangeEnd; i++)
			{
				const result = this.options.requestPoster(i);
				
				// If null is returned, this means that the stream has terminated.
				if (result === null)
				{
					canContinue = false;
					break;
				}
				
				maybePromises.push(result);
			}
			
			const newPosterCount = maybePromises.length;
			if (newPosterCount === 0)
				return;
			
			/*
			// This code is probably stupid.
			if (rangeStart === 0 && newPosterCount < this.size)
			{
				// The constrained size cannot go below 2. This means that if there
				// is only 1 preview returned, the Omniview is going to look a bit
				// awkward with a preview on the left side of the screen, and an
				// empty space on the right. If this is undesirable, the component
				// that owns the Omniview is responsible for avoiding this situation
				// by it's own means.
				this.sizeLimit = Math.max(2, newPosterCount);
				this.size = this.sizeLimit;
			}
			*/
			
			const elements: HTMLElement[] = [];
			
			for (const maybePromise of maybePromises)
			{
				if (!maybePromise)
					throw "?";
				
				if (maybePromise instanceof Promise)
				{
					const shim = raw.div(
						"element-placeholder",
						this.options.requestPlaceholder());
					
					elements.push(shim);
					
					maybePromise.then(element =>
					{
						if (element === null)
							return;
						
						for (const n of shim.getAttributeNames())
							if (n !== "style" && n !== "class")
								element.setAttribute(n, shim.getAttribute(n) || "");
						
						for (const definedProperty of Array.from(shim.style))
						{
							element.style.setProperty(
								definedProperty,
								shim.style.getPropertyValue(definedProperty));
						}
						
						raw.get(element)(
							// Classes that have been set on the shim since it was inserted
							// must be copied over to the element.
							Array.from(shim.classList), 
							raw.on("click", () => this.selectPoster(element))
						);
						
						shim.replaceWith(element);
					});
				}
				else
				{
					elements.push(raw.get(maybePromise)(
						raw.on("click", () => this.selectPoster(maybePromise))
					));
				}
			}
			
			for (const [i, e] of elements.entries())
			{
				setIndex(e, this.posterCount + i);
				e.classList.add(Const.poster);
			}
			
			this.postersElement.append(...elements);
			this.maybeRedraw(canContinue);
		}
		
		/** */
		private selectPoster(poster: HTMLElement)
		{
			dispatch(this.head, "squares:enter", { selectedElement: poster });
		}
		
		/** */
		private maybeRedraw(shouldAttemptContinue = false)
		{
			if (!this.postersElement.isConnected)
				return;
			
			let isNearingBottom = false;
			
			if (this.posterCount > 0)
			{
				const he = this.options.headerElement;
				const headerHeight = he ? parseInt(getComputedStyle(he).height) : 0;
				const y = this.head.scrollTop - headerHeight;
				const rowHeight = (this.width / this.size) * this.heightRatio;
				const rowCount = this.posterCount / this.size;
				const maxItemsPerScreen = (Math.ceil(this.height / rowHeight) + 1) * this.size;
				const visibleRowStart = Math.floor(y / rowHeight);
				const visibleItemStart = visibleRowStart * this.size;
				const visibleItemEnd = visibleItemStart + maxItemsPerScreen;
				const elementsWithTop = new Set(getByClass(Const.hasCssTop, this.postersElement));
				const elementsVisible = new Set(getByClass(getShowClass(), this.postersElement));
				const children = Array.from(this.postersElement.children)
					.filter(e => e instanceof HTMLDivElement);
				
				for (let i = visibleItemStart; i < visibleItemEnd; i++)
				{
					const e = children[i];
					if (!(e instanceof HTMLDivElement))
					{
						if (i >= children.length)
							break;
						
						continue;
					}
					
					const sign = getIndex(e) > 0 ? 1 : -1;
					const pct = (100 * this.rowOf(e) * sign).toFixed(5);
					e.style.top = `calc(${this.headerCssHeight || 0} + ${pct}% / var(${Const.sizeVar}))`;
					e.classList.add(Const.hasCssTop, getShowClass());
					
					elementsWithTop.delete(e);
					elementsVisible.delete(e);
				}
				
				for (const e of elementsWithTop)
				{
					e.style.removeProperty("top");
					e.classList.remove(Const.hasCssTop);
				}
				
				for (const e of elementsVisible)
					e.classList.remove(getShowClass());
				
				if (y !== this.lastY)
				{
					let region: EdgeCollisionRegion | null = null;
					const bottom = this.head.scrollHeight - this.head.offsetHeight;
					
					if (this.lastY > 0 && y <= 0)
						region = "top";
					
					else if (this.lastY <= 0 && y > 0)
						region = "top-exit";
					
					else if (this.lastY >= bottom && y < bottom)
						region = "bottom-exit";
					
					else if (y >= bottom && this.lastY < bottom)
						region = "bottom";
					
					if (region)
						dispatch(this.head, "squares:scrolledgecollision", { region });
					
					this.lastY = y;
					isNearingBottom = (y + this.height) > (rowCount - 1) * rowHeight;
				}
			}
			
			if (shouldAttemptContinue && isNearingBottom)
				this.maybeFetch(1);
		}
		
		private lastY = -1;
		
		
		
		/**
		 * Returns the sequential index of the row in which
		 * the specified preview element is rendered.
		 */
		private rowOf(previewElement: Element)
		{
			const eIdx = getIndex(previewElement);
			const rowIndex = Math.floor(eIdx / this.size);
			return rowIndex;
		}
	}
}
