import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

if (process.env.NODE_ENV === "production") {
    // Weekly full sync — fans out one syncHackathon per slug. Change-detected.
    crons.weekly(
        "weekly full sync",
        { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
        internal.ingest.scheduleSyncAll,
        { fetch_images: true },
    );

    // Embed scan is triggered on-demand by syncHackathon when changes happen.
    // No separate poll cron needed.

    // Images are public-read in S3 and served by stable unsigned URLs — no
    // signed-URL refresh cron needed.
}

export default crons;
