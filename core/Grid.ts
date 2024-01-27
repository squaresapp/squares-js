
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
		constructor(readonly options: IGridOptions)
		{
			this.head = raw.div(
				"squares-js-grid",
				unselectable,
				{
					position: "relative",
					minHeight: "100%",
					overflowY: "auto",
				},
				raw.on("scroll", () => this.maybeRedraw(true)),
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
			const dp1 = window.devicePixelRatio === 1;
			const width = this.viewportElement.offsetWidth;
			const logicalWidth = width / window.devicePixelRatio;
			
			if (logicalWidth <= (dp1 ? 900 : 450))
				return 2;
			
			if (logicalWidth <= (dp1 ? 1400 : 700))
				return 3;
			
			if (logicalWidth <= 1800)
				return 4;
			
			return 5;
		}
		
		/**
		 * Gets the number of posters that exist within the DOM.
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
			
			if (this.options.maxPosterCount)
				rangeEnd = Math.min(this.options.maxPosterCount, rangeEnd);
			
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
			dispatch(this.head, "squares:posterselected", { poster });
		}
		
		/** */
		private maybeRedraw(shouldAttemptContinue = false)
		{
			if (!this.postersElement.isConnected)
				return;
			
			let isNearingBottom = false;
			
			if (this.posterCount > 0)
			{
				const y = this.head.scrollTop;
				const rowHeight = (this.width / this.size) * this.heightRatio;
				const rowCount = this.posterCount / this.size;
				const maxItemsPerScreen = (Math.ceil(this.height / rowHeight) + 1) * this.size;
				const visibleRowStart = Math.floor(y / rowHeight);
				const visibleItemStart = visibleRowStart * this.size;
				const visibleItemEnd = visibleItemStart + maxItemsPerScreen;
				const elementsWithTop = new Set(getByClass(Const.hasCssTop, this.postersElement));
				const elementsVisible = new Set(getByClass(showClass, this.postersElement));
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
					e.style.top = `calc(${pct}% / var(${Const.sizeVar}))`;
					e.classList.add(Const.hasCssTop, showClass);
					
					elementsWithTop.delete(e);
					elementsVisible.delete(e);
				}
				
				for (const e of elementsWithTop)
				{
					e.style.removeProperty("top");
					e.classList.remove(Const.hasCssTop);
				}
				
				for (const e of elementsVisible)
					e.classList.remove(showClass);
				
				if (y !== this.lastY)
				{
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