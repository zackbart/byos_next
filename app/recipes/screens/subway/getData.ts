import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

interface TrainArrival {
	line: "A" | "C";
	destination: string;
	arrivalTime: Date;
	arrivalTimeStr: string;
	minutesAway: number;
}

interface SubwayData {
	stationName: string;
	direction: string;
	arrivals: TrainArrival[];
	aTrains: TrainArrival[];
	cTrains: TrainArrival[];
	lastUpdated: string;
	currentTime: string;
	currentDate: string;
}

type SubwayParams = {
	stopId?: string;
	stationName?: string;
	direction?: string;
	maxTrains?: number;
};

const MTA_ACE_FEED_URL =
	"https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace";

/**
 * Fetch and parse MTA GTFS-realtime feed for A/C/E trains
 */
async function fetchMtaFeed(): Promise<GtfsRealtimeBindings.transit_realtime.FeedMessage | null> {
	try {
		const response = await fetch(MTA_ACE_FEED_URL, {
			headers: {
				Accept: "application/x-protobuf",
			},
			next: { revalidate: 0 },
		});

		if (!response.ok) {
			throw new Error(`MTA API responded with status: ${response.status}`);
		}

		const buffer = await response.arrayBuffer();
		const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
			new Uint8Array(buffer),
		);

		return feed;
	} catch (error) {
		console.error("Error fetching MTA feed:", error);
		return null;
	}
}

/**
 * Extract train arrivals for a specific stop from the GTFS feed
 * Returns all arrivals, plus separated A and C train arrays
 */
function extractArrivals(
	feed: GtfsRealtimeBindings.transit_realtime.FeedMessage,
	stopId: string,
	maxPerLine: number,
): { all: TrainArrival[]; aTrains: TrainArrival[]; cTrains: TrainArrival[] } {
	const now = new Date();
	const arrivals: TrainArrival[] = [];

	for (const entity of feed.entity) {
		if (!entity.tripUpdate) continue;

		const tripUpdate = entity.tripUpdate;
		const tripId = tripUpdate.trip?.tripId || "";

		// Determine train line from trip ID (format: 021150_A..N or similar)
		let line: "A" | "C" | null = null;
		if (tripId.includes("_A")) {
			line = "A";
		} else if (tripId.includes("_C")) {
			line = "C";
		}

		if (!line) continue;

		// Find stop time update for our stop
		const stopTimeUpdates = tripUpdate.stopTimeUpdate || [];
		for (const stopTime of stopTimeUpdates) {
			if (stopTime.stopId !== stopId) continue;

			// Get arrival time (prefer arrival, fall back to departure)
			const arrivalTimestamp =
				stopTime.arrival?.time || stopTime.departure?.time;
			if (!arrivalTimestamp) continue;

			// Convert to JavaScript timestamp (GTFS uses seconds, JS uses milliseconds)
			const arrivalMs =
				typeof arrivalTimestamp === "number"
					? arrivalTimestamp * 1000
					: Number(arrivalTimestamp) * 1000;

			const arrivalTime = new Date(arrivalMs);

			// Skip trains that have already passed
			if (arrivalTime <= now) continue;

			// Calculate minutes away
			const minutesAway = Math.round(
				(arrivalTime.getTime() - now.getTime()) / 60000,
			);

			// Format arrival time as "2:35 PM"
			const arrivalTimeStr = arrivalTime.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
				timeZone: "America/New_York",
			});

			arrivals.push({
				line,
				destination: "Manhattan",
				arrivalTime,
				arrivalTimeStr,
				minutesAway,
			});
		}
	}

	// Sort all arrivals by time
	const sorted = arrivals.sort(
		(a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime(),
	);

	// Separate and limit A and C trains
	const aTrains = sorted.filter((t) => t.line === "A").slice(0, maxPerLine);
	const cTrains = sorted.filter((t) => t.line === "C").slice(0, maxPerLine);

	return {
		all: sorted.slice(0, maxPerLine * 2),
		aTrains,
		cTrains,
	};
}

/**
 * Internal function to fetch subway data
 */
async function getSubwayData(
	stopId: string,
	stationName: string,
	direction: string,
	maxTrains: number,
): Promise<SubwayData | null> {
	try {
		const feed = await fetchMtaFeed();
		if (!feed) {
			throw new Error("Failed to fetch MTA feed");
		}

		// maxTrains is now per line (4 A trains + 4 C trains = 8 total)
		const { all, aTrains, cTrains } = extractArrivals(feed, stopId, maxTrains);

		const now = new Date();
		const currentTime = now.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
			timeZone: "America/New_York",
		});

		const currentDate = now.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			timeZone: "America/New_York",
		});

		const lastUpdated = now.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZone: "America/New_York",
		});

		return {
			stationName,
			direction,
			arrivals: all,
			aTrains,
			cTrains,
			lastUpdated,
			currentTime,
			currentDate,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (
			errorMessage.includes("prerender") ||
			errorMessage.includes("HANGING_PROMISE_REJECTION") ||
			errorMessage.includes("prerender is complete")
		) {
			return null;
		}
		console.error("Error fetching subway data:", error);
		return null;
	}
}

/**
 * Function that fetches subway data without caching
 */
async function fetchSubwayDataNoCache(
	params: SubwayParams,
): Promise<SubwayData> {
	const stopId = params.stopId || "A42N";
	const stationName = params.stationName || "Utica Ave";
	const direction = params.direction || "Manhattan";
	const maxTrains = params.maxTrains || 4; // 4 per line = 8 total

	const data = await getSubwayData(stopId, stationName, direction, maxTrains);

	if (!data) {
		const now = new Date();
		return {
			stationName,
			direction,
			arrivals: [],
			aTrains: [],
			cTrains: [],
			lastUpdated: "N/A",
			currentTime: now.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
				timeZone: "America/New_York",
			}),
			currentDate: now.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				timeZone: "America/New_York",
			}),
		};
	}

	return data;
}

/**
 * Helper function to create a cached function for subway data
 */
function createCachedSubwayData(
	stopId: string,
	stationName: string,
	direction: string,
	maxTrains: number,
) {
	return unstable_cache(
		async (): Promise<SubwayData> => {
			const data = await getSubwayData(
				stopId,
				stationName,
				direction,
				maxTrains,
			);

			if (!data) {
				throw new Error("Empty or invalid data - skip caching");
			}

			return data;
		},
		["subway-data", stopId],
		{
			tags: ["subway", "mta", stopId],
			revalidate: 60, // Cache for 1 minute (MTA updates every 30 seconds)
		},
	);
}

/**
 * Main export function
 */
export default async function getData(
	params?: SubwayParams,
): Promise<SubwayData> {
	const stopId = params?.stopId || "A42N";
	const stationName = params?.stationName || "Utica Ave";
	const direction = params?.direction || "Manhattan";
	const maxTrains = params?.maxTrains || 4; // 4 per line = 8 total

	try {
		const cachedFunction = createCachedSubwayData(
			stopId,
			stationName,
			direction,
			maxTrains,
		);
		return await cachedFunction();
	} catch (error) {
		console.log("Cache skipped or error:", error);
		return fetchSubwayDataNoCache({
			stopId,
			stationName,
			direction,
			maxTrains,
		});
	}
}
