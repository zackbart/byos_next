import { PreSatori } from "@/utils/pre-satori";

interface TrainArrival {
	line: "A" | "C";
	destination: string;
	arrivalTime: Date;
	arrivalTimeStr: string;
	minutesAway: number;
}

interface SubwayProps {
	stationName?: string;
	direction?: string;
	arrivals?: TrainArrival[];
	aTrains?: TrainArrival[];
	cTrains?: TrainArrival[];
	lastUpdated?: string;
	currentTime?: string;
	currentDate?: string;
	width?: number;
	height?: number;
}

// Column component for each train line
function _TrainColumn({
	line,
	trains,
	isHalfScreen,
}: {
	line: "A" | "C";
	trains: TrainArrival[];
	isHalfScreen: boolean;
}) {
	const maxTrains = isHalfScreen ? 3 : 4;
	const displayTrains = trains.slice(0, maxTrains);

	return (
		<div className="flex flex-col flex-1">
			{/* Line header */}
			<div className="flex flex-row items-center justify-center py-2 bg-black text-white">
				<div className={`font-bold ${isHalfScreen ? "text-3xl" : "text-4xl"}`}>
					Ⓐ {line} Train
				</div>
			</div>

			{/* Train list */}
			<div className="flex flex-col flex-1">
				{displayTrains.length === 0 ? (
					<div className="flex flex-1 items-center justify-center">
						<div
							className={`text-black ${isHalfScreen ? "text-lg" : "text-xl"}`}
						>
							No {line} trains
						</div>
					</div>
				) : (
					displayTrains.map((arrival, index) => (
						<div
							key={index}
							className={`flex flex-row items-center justify-between px-3 ${isHalfScreen ? "py-2" : "py-3"} ${index < displayTrains.length - 1 ? "border-b border-black" : ""}`}
						>
							<div className="flex flex-col">
								<div
									className={`font-bold ${isHalfScreen ? "text-2xl" : "text-3xl"}`}
								>
									{arrival.arrivalTimeStr}
								</div>
								<div
									className={`text-black ${isHalfScreen ? "text-lg" : "text-xl"}`}
								>
									{arrival.minutesAway} min
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

export default function Subway({
	stationName = "Utica Ave",
	direction = "Manhattan",
	aTrains = [],
	cTrains = [],
	currentTime = "--:--",
	currentDate = "---",
	width = 800,
	height = 480,
}: SubwayProps) {
	const isHalfScreen = width === 400 && height === 480;

	return (
		<PreSatori width={width} height={height}>
			<div className="flex flex-col w-full h-full bg-white font-inter">
				{/* Header */}
				<div className="flex flex-row justify-between items-center p-3 bg-black text-white">
					<div className="flex flex-col">
						<div
							className={`font-bold ${isHalfScreen ? "text-3xl" : "text-4xl"}`}
						>
							{stationName.toUpperCase()}
						</div>
						<div className={isHalfScreen ? "text-lg" : "text-xl"}>
							to {direction}
						</div>
					</div>
					<div className="flex flex-col items-end">
						<div
							className={`font-bold ${isHalfScreen ? "text-2xl" : "text-3xl"}`}
						>
							{currentTime}
						</div>
						<div className={isHalfScreen ? "text-lg" : "text-xl"}>
							{currentDate}
						</div>
					</div>
				</div>

				{/* Two-column layout */}
				<div className="flex flex-row flex-1">
					{/* A Train Column */}
					<div className="flex flex-col flex-1 border-r-2 border-black">
						<div className="flex flex-row items-center justify-center py-2 border-b-2 border-black">
							<div
								className={`font-bold ${isHalfScreen ? "text-3xl" : "text-4xl"}`}
							>
								Ⓐ A Train
							</div>
						</div>
						<div className="flex flex-col flex-1">
							{aTrains.length === 0 ? (
								<div className="flex flex-1 items-center justify-center">
									<div
										className={`text-black ${isHalfScreen ? "text-lg" : "text-xl"}`}
									>
										No A trains
									</div>
								</div>
							) : (
								aTrains.slice(0, isHalfScreen ? 3 : 4).map((arrival, index) => (
									<div
										key={index}
										className={`flex flex-row items-center justify-between px-3 ${isHalfScreen ? "py-3" : "py-4"} ${index < Math.min(aTrains.length, isHalfScreen ? 3 : 4) - 1 ? "border-b border-black" : ""}`}
									>
										<div
											className={`font-bold ${isHalfScreen ? "text-2xl" : "text-3xl"}`}
										>
											{arrival.arrivalTimeStr}
										</div>
										<div
											className={`text-black ${isHalfScreen ? "text-xl" : "text-2xl"}`}
										>
											{arrival.minutesAway} min
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* C Train Column */}
					<div className="flex flex-col flex-1">
						<div className="flex flex-row items-center justify-center py-2 border-b-2 border-black">
							<div
								className={`font-bold ${isHalfScreen ? "text-3xl" : "text-4xl"}`}
							>
								Ⓒ C Train
							</div>
						</div>
						<div className="flex flex-col flex-1">
							{cTrains.length === 0 ? (
								<div className="flex flex-1 items-center justify-center">
									<div
										className={`text-black ${isHalfScreen ? "text-lg" : "text-xl"}`}
									>
										No C trains
									</div>
								</div>
							) : (
								cTrains.slice(0, isHalfScreen ? 3 : 4).map((arrival, index) => (
									<div
										key={index}
										className={`flex flex-row items-center justify-between px-3 ${isHalfScreen ? "py-3" : "py-4"} ${index < Math.min(cTrains.length, isHalfScreen ? 3 : 4) - 1 ? "border-b border-black" : ""}`}
									>
										<div
											className={`font-bold ${isHalfScreen ? "text-2xl" : "text-3xl"}`}
										>
											{arrival.arrivalTimeStr}
										</div>
										<div
											className={`text-black ${isHalfScreen ? "text-xl" : "text-2xl"}`}
										>
											{arrival.minutesAway} min
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
