
namespace SquaresJS
{
	/** */
	export class Page
	{
		readonly head;
		readonly swiper;
		private readonly scrollable;
		
		/** */
		constructor(
			sections: HTMLElement[],
			private readonly sourcePoster: HTMLElement,
			private readonly path: string)
		{
			this.swiper = new Swiper();
			
			this.head = raw.div(
				"squares-js-page",
				{
					width: "100%",
					height: "100%",
				},
				raw.on("connected", async () =>
				{
					this.swiper.setVisiblePane(1);
					this.setupRetractionTracker();
					
					// This had to be done in a setTimeout before
					// Make sure this works like this in Safari.
					this.scrollable.scrollTo(0, window.innerHeight);
				}),
				this.swiper
			);
			
			this.swiper.addPane(raw.div("exit-left-pane"));
			this.swiper.addPane(this.scrollable = raw.div(
				"scrollable",
				{
					height: "100%",
					scrollSnapType: "y mandatory",
					overflowY: "auto",
				},
				raw.css(" > *", {
					scrollSnapAlign: "start",
					scrollSnapStop: "always",
					height: "100%",
					position: "relative"
				}),
				raw.css(" > :not(.exiter)", {
					background: "green"
				}),
				raw.div("exiter exit-top"),
				sections,
				raw.div("exiter exit-bottom"),
			));
			
			this.setVisibleSection(0);
		}
		
		/** */
		setVisibleSection(sectionIndex: number)
		{
			if (this.head.isConnected)
			{
				sectionIndex = Math.max(0, sectionIndex);
				const e = this.scrollable;
				const children = Array.from(e.children).slice(1, -1) as HTMLElement[];
				const child = children[sectionIndex];
				e.scrollTo(0, child.scrollTop);
			}
			else this.deferredVisibleIndex = sectionIndex;
		}
		
		private deferredVisibleIndex = -1;
		
		/** */
		private setupRetractionTracker()
		{
			let lastScrollTop = -1;
			let lastScrollLeft = -1;
			let timeoutId: any = 0;
			
			const handler = () =>
			{
				let clipTop = 0;
				let clipBottom = 0;
				let clipLeft = 0;
				
				const e = this.scrollable;
				const w = e.offsetWidth;
				const offsetHeight = e.offsetHeight;
				const scrollHeight = e.scrollHeight;
				const scrollLeft = this.swiper.head.scrollLeft;
				const scrollTop = e.scrollTop;
				
				if (scrollTop < offsetHeight)
					clipTop = offsetHeight - scrollTop;
				
				if (scrollLeft < w)
					clipLeft = 1 - scrollLeft / w;
				
				else if (scrollTop > scrollHeight - offsetHeight * 2)
				{
					clipBottom = scrollTop - (scrollHeight - offsetHeight);
				}
				
				clipLeft *= 100;
				this.head.style.clipPath = `inset(${clipTop}px 0 ${clipBottom}px ${clipLeft}%)`;
				
				// Deal with retraction notification
				let retractPct = -1;
				
				if (scrollLeft < w)
					retractPct = scrollLeft / w;
				
				else if (scrollTop < offsetHeight)
					retractPct = scrollTop / offsetHeight;
				
				else if (scrollTop >= scrollHeight - offsetHeight * 2)
					retractPct = (scrollHeight - offsetHeight - scrollTop) / offsetHeight;
				
				if (retractPct > 0)
					dispatch(this, "squares:retract", { amount: retractPct });
				
				// Remove the element if necessary
				clearTimeout(timeoutId);
				if (retractPct > 0)
				{
					lastScrollLeft = scrollLeft;
					lastScrollTop = scrollTop;
					
					timeoutId = setTimeout(() =>
					{
						if (scrollLeft !== lastScrollLeft)
							return;
						
						if (scrollTop !== lastScrollTop)
							return;
						
						// A more elegant way to deal with this would be to animate
						// it off the screen... but just removing it is good enough for now
						// because this is just an edge case that isn't going to happen
						// very often.
						if (scrollLeft <= 2||
							scrollTop <= 2 ||
							scrollTop >= scrollHeight - offsetHeight - 2)
						{
							this.disconnect();
						}
					});
				}
			};
			
			this.scrollable.addEventListener("scroll", handler);
			this.swiper.head.addEventListener("scroll", handler);
		}
		
		/**
		 * Retracts the page off the screen.
		 * The "panic" mode is used when the page needs to be
		 * moved off the screen as soon as possible, for example,
		 * when the user has begun to scroll the underlying grid.
		 */
		retract(panic?: "panic")
		{
			if (panic)
			{
				return new Promise<void>(r =>
				{
					const slideAway = (axis: "x" | "y", amount: number) =>
					{
						const ms = 100;
						const e = this.head;
						e.style.transitionDuration = ms + "ms";
						e.style.transitionProperty = "transform";
						e.style.transform = `translate${axis.toLocaleUpperCase()}(${amount}px)`;
						e.style.pointerEvents = "none";
						
						setTimeout(() =>
						{
							this.disconnect();
							r();
						},
						ms);
					}
					
					const e = this.scrollable;
					const w = e.offsetWidth;
					const offsetHeight = e.offsetHeight;
					const scrollLeft = this.swiper.head.scrollLeft;
					const scrollTop = e.scrollTop;
					
					// This check will indicate whether the pageHat has rightward
					// scrolling inertia. If it does, it's scrolling will halt and it will be
					// necessary to animate the pageHat away manually.
					if (scrollLeft > 0 && scrollLeft < w)
						slideAway("x", scrollLeft);
					
					else if (scrollTop > 0 && scrollTop < offsetHeight)
						slideAway("y", scrollTop);
					
					// No inertia
					else
					{
					}
				});
			}
			else
			{
				this.swiper.head.scrollTo({ left: 0, top: 0, behavior: "smooth" });
			}
		}
		
		/** */
		private disconnect()
		{
			dispatch(this, "squares:exit", { path: this.path, sourcePoster: this.sourcePoster });
			this.head.remove();
		}
	}
}
