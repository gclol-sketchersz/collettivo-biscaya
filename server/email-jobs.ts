import {
  getUsersForNewCallNotifications,
  getUsersForDeadlineReminders,
  getRecentlyAddedCalls,
  getCallsWithUpcomingDeadlines,
  updateLastEmailSent,
} from "./db";
import {
  sendNewCallsEmail,
  sendDeadlineReminderEmail,
} from "./email-service";

/**
 * Job to send new calls notifications
 * Run daily to notify users about newly added calls
 */
export async function sendNewCallsNotifications() {
  console.log("[Jobs] Starting new calls notification job...");

  try {
    const users = await getUsersForNewCallNotifications();
    console.log(`[Jobs] Found ${users.length} users to notify about new calls`);

    if (users.length === 0) {
      console.log("[Jobs] No users to notify");
      return;
    }

    // Get recently added calls (last 24 hours)
    const recentCalls = await getRecentlyAddedCalls(24);
    console.log(`[Jobs] Found ${recentCalls.length} recently added calls`);

    if (recentCalls.length === 0) {
      console.log("[Jobs] No recent calls to notify about");
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      if (!user.email) {
        console.warn(`[Jobs] User ${user.userId} has no email address`);
        continue;
      }

      const success = await sendNewCallsEmail(
        user.email,
        user.name || "User",
        recentCalls
      );

      if (success) {
        await updateLastEmailSent(user.userId);
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log(
      `[Jobs] New calls notification job completed: ${successCount} sent, ${failureCount} failed`
    );
  } catch (error) {
    console.error("[Jobs] Error in new calls notification job:", error);
  }
}

/**
 * Job to send deadline reminder notifications
 * Run daily to remind users about upcoming deadlines
 */
export async function sendDeadlineReminders() {
  console.log("[Jobs] Starting deadline reminder job...");

  try {
    const users = await getUsersForDeadlineReminders();
    console.log(`[Jobs] Found ${users.length} users to notify about deadlines`);

    if (users.length === 0) {
      console.log("[Jobs] No users to notify");
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      if (!user.email) {
        console.warn(`[Jobs] User ${user.userId} has no email address`);
        continue;
      }

      const daysAhead = user.preferences?.deadlineReminderDays || 7;
      const upcomingCalls = await getCallsWithUpcomingDeadlines(daysAhead);

      if (upcomingCalls.length === 0) {
        console.log(
          `[Jobs] No upcoming deadlines for user ${user.userId} in the next ${daysAhead} days`
        );
        continue;
      }

      const success = await sendDeadlineReminderEmail(
        user.email,
        user.name || "User",
        upcomingCalls
      );

      if (success) {
        await updateLastEmailSent(user.userId);
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log(
      `[Jobs] Deadline reminder job completed: ${successCount} sent, ${failureCount} failed`
    );
  } catch (error) {
    console.error("[Jobs] Error in deadline reminder job:", error);
  }
}

/**
 * Schedule jobs to run at specific times
 */
export function scheduleEmailJobs() {
  // Check if we should schedule jobs (only in production or if explicitly enabled)
  if (process.env.NODE_ENV !== "production" && !process.env.ENABLE_EMAIL_JOBS) {
    console.log("[Jobs] Email jobs disabled (set ENABLE_EMAIL_JOBS=true to enable)");
    return;
  }

  console.log("[Jobs] Scheduling email notification jobs...");

  // Run new calls notification every day at 9:00 AM UTC
  const newCallsTime = process.env.NEW_CALLS_JOB_TIME || "09:00";
  scheduleDaily(newCallsTime, sendNewCallsNotifications, "New Calls Notification");

  // Run deadline reminders every day at 10:00 AM UTC
  const deadlineTime = process.env.DEADLINE_JOB_TIME || "10:00";
  scheduleDaily(deadlineTime, sendDeadlineReminders, "Deadline Reminder");

  console.log("[Jobs] Email jobs scheduled successfully");
}

/**
 * Schedule a function to run at a specific time each day
 */
function scheduleDaily(
  timeString: string,
  job: () => Promise<void>,
  jobName: string
) {
  const [hours, minutes] = timeString.split(":").map(Number);

  function calculateDelay() {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setUTCHours(hours, minutes, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    return scheduledTime.getTime() - now.getTime();
  }

  async function runJob() {
    try {
      await job();
    } catch (error) {
      console.error(`[Jobs] Error running ${jobName}:`, error);
    }

    // Schedule next run
    const delay = calculateDelay();
    setTimeout(runJob, delay);
  }

  const initialDelay = calculateDelay();
  console.log(
    `[Jobs] ${jobName} scheduled to run in ${Math.round(initialDelay / 1000 / 60)} minutes`
  );

  setTimeout(runJob, initialDelay);
}
