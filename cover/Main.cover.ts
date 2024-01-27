
namespace Cover
{
	setTimeout(coverSquares, 10);
	
	/** */
	export async function coverSquares()
	{
		const sq = new Squares({
			gridPath: "/",
			maxPosterCount: 20,
			anchorPosterIndex: 0,
			viewportElement: document.body,
			
			requestPlaceholder()
			{
				return raw.div(raw.text("Loading"));
			},
			requestPoster(position: number)
			{
				return generateFrame("Poster " + position, Bg.orange);
			},
			requestPage(selectedElement, selectedIndex)
			{
				return {
					path: "path-" + selectedIndex,
					sections: [
						generateFrame("Poster " + selectedIndex, Bg.orange),
						generateFrame("Filler 1", Bg.black),
						generateFrame("Filler 2", Bg.black),
					]
				}
			},
		});
		
		raw.get(document.documentElement)({
			fontFamily: "sans-serif",
			background: "black"
		});
		
		raw.get(document.body)(
			{
				height: "100vh",
				margin: 0,
				padding: 0,
			},
			sq
		);
	}
	
	/** */
	export async function coverPage()
	{
		document.head.append(
			raw.link({ rel: "webfeed", href: "/" })
		);
		
		document.body.append(
			generateFrame("Home", Bg.orange),
			generateFrame("Frame 1", Bg.black),
			generateFrame("Frame 2", Bg.black),
		);
	}
	
	/** */
	function generateFrame(text: string, bg: Bg)
	{
		return raw.div(
			"frame",
			{
				backgroundImage: bg.toString(),
			},
			raw.div(
				{
					position: "absolute",
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					margin: "auto",
					width: "fit-content",
					height: "fit-content",
					color: "white",
					fontSize: "15vw",
					fontWeight: 900,
					textAlign: "center",
				},
				raw.text(text)
			)
		);
	}
	
	/** */
	const enum Bg
	{
		orange = "linear-gradient(45deg, orange, crimson)",
		black = "linear-gradient(135deg, black, rgb(70, 70, 70))",
	}
	
	/** */
	export async function coverPuller()
	{
		const puller = new SquaresJS.Puller(raw.div(
			{
				
			}
		));
		
		raw.get(document.body)(
			{
				height: "100vh",
				margin: 0,
				padding: 0,
			},
			raw.get(puller)(
				{
					width: "100%",
					height: "100%",
				}
			)
		);
	}
	
	declare const module: any;
	typeof module !== "undefined" && Object.assign(module.exports, { Cover });
}
