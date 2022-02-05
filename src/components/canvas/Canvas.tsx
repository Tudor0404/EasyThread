import React, { useRef, useEffect } from "react";
import Paper from "paper";
import useResizeObserver from "use-resize-observer";
import useState from "react-usestateref";

import options from "../../data/options.json";
import eventBus from "../../lib/eventBus";
import UndoRedoTool from "../../lib/canvas/UndoRedoTool";

interface Props { }

// TODO: Handle errors from uploading/downloading files etc.

const Canvas: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// using useStateRefs for the width and height because they are not updated in passed functions, which results in the original values (1, 1) being used in functions such as the one to reset view, instead of the new dimensions
	const [width, setWidth, refWidth] = useState<number>(1);
	const [height, setHeight, refHeight] = useState<number>(1);
	// prevent selection for a short while after dragging
	const [preventSelect, setPreventSelect, refPreventSelect] = useState(false);
	const [timer, setTimer] = useState<NodeJS.Timeout>();
	// get updates on the dimsenions of the encapsulating div
	const { ref } = useResizeObserver({
		onResize: ({ width, height }) => {
			if (width) setWidth(width);
			if (height) setHeight(height);
		},
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	function onClickItemEvent(e: paper.MouseEvent) {
		// prevent from selecting items below it
		e.stopPropagation();
		// allow for multi selection only if holding control key at the same time
		if (!refPreventSelect.current) {
			if (!e.modifiers.control)
				Paper.project.selectedItems.forEach((el) => {
					if (el !== e.target) el.selected = false;
				});
			e.target.selected = !e.target.selected;
		}
		eventBus.dispatch("selectedItemsChanged", {});
	}

	function openFileDialog() {
		fileInputRef.current?.click();
	}

	function setCenter() {
		Paper.view.center = new Paper.Point(
			Paper.project.view.bounds.width / 2,
			Paper.project.view.bounds.height / 2
		);
	}

	function setZoom() {
		Paper.view.zoom = 1;
	}

	// add SVG to screen
	function addSvg(svg: string, title?: string) {
		Paper.project.clear();

		const item = Paper.project.importSVG(svg, {
			insert: false,
			expandShapes: true,
		});

		// add item to new layer, so that the layer can be centered by itself
		let l = new Paper.Layer();
		l.addChild(item);

		Paper.project.getItems({}).forEach((e) => {
			if (e.hasChildren()) return;
			//@ts-ignore
			e.onClick = onClickItemEvent;
		});

		l.position = new Paper.Point(width / 2, height / 2);

		eventBus.dispatch("initialSvgBounds", {
			width: l.strokeBounds.width,
			height: l.strokeBounds.height,
		});

		console.log(l);

		if (title) eventBus.dispatch("initialFilename", title);

		Paper.view.update();
	}

	function handleFileUploaded(e: React.ChangeEvent<HTMLInputElement>) {
		let reader = new FileReader();

		if (!e.target.files) return;

		if (e.target.files[0].type !== "image/svg+xml") return;

		reader.onload = (f: ProgressEvent<FileReader>) => {
			try {
				if (!f.target || !f.target.result) return;
				//@ts-ignore
				addSvg(f.target.result.toString(), e.target.files[0].name);
			} catch {}
		};

		reader.readAsText(e.target.files[0]);
	}

	function setSelectedStroke(hex: string) {
		Paper.project.selectedItems.forEach((e) => {
			e.strokeColor = new Paper.Color(hex);
		});
	}

	function setSelectedFill(hex: string) {
		Paper.project.selectedItems.forEach((e) => {
			e.fillColor = new Paper.Color(hex);
		});
	}

	useEffect(() => {
		//@ts-ignore
		Paper.setup(canvasRef.current);

		new Paper.Tool().on({
			// dragging functionality
			mousedrag: function (event: paper.ToolEvent) {
				event.stopPropagation();
				event.preventDefault();
				let pan_offset = event.point.subtract(event.downPoint);
				Paper.view.center = Paper.view.center.subtract(pan_offset);
				setPreventSelect(true);
			},
		});

		//#region bus events
		eventBus.on("resetView", () => {
			setZoom();
			setCenter();
		});

		eventBus.on("resetCenter", () => {
			setCenter();
		});

		eventBus.on("setSelectedStrokeColour", (data: any) => {
			if (Paper.project.selectedItems.length > 0) {
				UndoRedoTool.addStateDefault();
				setSelectedStroke(data);
			}
		});

		eventBus.on("setSelectedFillColour", (data: any) => {
			if (Paper.project.selectedItems.length > 0) {
				UndoRedoTool.addStateDefault();
				setSelectedFill(data);
			}
		});

		eventBus.on("removeSelectedStroke", () => {
			if (Paper.project.selectedItems.length > 0) {
				UndoRedoTool.addStateDefault();
				Paper.project.selectedItems.forEach((e) => {
					e.strokeColor = null;
				});
			}
		});

		eventBus.on("removeSelectedFill", () => {
			if (Paper.project.selectedItems.length > 0) {
				UndoRedoTool.addStateDefault();
				Paper.project.selectedItems.forEach((e) => {
					e.fillColor = null;
				});
			}
		});

		eventBus.on("setCanvasLayer", (layer: paper.Layer) => {
			if (layer) {
				Paper.project.clear();
				Paper.project.addLayer(layer);

				Paper.project.getItems({}).forEach((e) => {
					if (e.hasChildren()) return;
					//@ts-ignore
					e.onClick = onClickItemEvent;
					e.selected = false;
				});
			}
		});

		eventBus.on("openLocalFile", () => {
			openFileDialog();
		});

		//#endregion

		return eventBus.remove(
			[
				"resetView",
				"resetCenter",
				"setSelectedStrokeColour",
				"setSelectedFillColour",
				"removeSelectedStroke",
				"removeSelectedFill",
				"setCanvasLayer",
				"openLocalFile",
			],
			() => {}
		);
	}, []);

	useEffect(() => {
		if (timer) {
			clearTimeout(timer);
		}

		if (preventSelect) {
			setTimer(
				setTimeout(() => {
					setPreventSelect(false);
				}, 200)
			);
		}

		//@ts-ignore
		return () => clearTimeout(timer);
	}, [preventSelect]);

	useEffect(() => {
		Paper.project.layers.forEach((element) => {
			if (width && height)
				element.position = new Paper.Point(width / 2, height / 2);
		});
	}, [width, height]);

	return (
		<div ref={ref} className="overflow-none h-full w-full">
			<canvas
				ref={canvasRef}
				className="h-full w-full"
				id="canvas"
				onWheel={(event) => {
					let newZoom = Paper.view.zoom;
					let oldZoom = Paper.view.zoom;

					if (event.deltaY < 0) {
						newZoom = Paper.view.zoom + 0.15;
						newZoom =
							newZoom > options.maxZoom
								? options.maxZoom
								: newZoom;
					} else {
						newZoom = Paper.view.zoom - 0.15;
						newZoom =
							newZoom < options.minZoom
								? options.minZoom
								: newZoom;
					}

					let beta = oldZoom / newZoom;

					let mousePosition = new Paper.Point(
						event.clientX,
						event.clientY
					);

					var viewPosition = Paper.view.viewToProject(mousePosition);

					var mpos = viewPosition;
					var ctr = Paper.view.center;

					var pc = mpos.subtract(ctr);
					var offset = mpos.subtract(pc.multiply(beta)).subtract(ctr);

					Paper.view.zoom = newZoom;
					Paper.view.center = Paper.view.center.add(offset);

					event.preventDefault();
					Paper.view.update();
				}}
			></canvas>
			<input
				ref={fileInputRef}
				type={"file"}
				className="absolute -top-full"
				accept=".svg"
				onChange={handleFileUploaded}
			/>
		</div>
	);
};

export default Canvas;
