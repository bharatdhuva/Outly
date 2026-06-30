import { Router, Response } from "express";
import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth.js";
import { ActivityLog } from "../../db/models.js";
import { activityQueries } from "../../db/queries.js";

const router = Router();

// Protect job search route
router.use(requireAuth);

// Helper function to fetch jobs from JSearch with automatic 429 retry
async function fetchSourceWithRetry(
  query: string,
  isRemoteSearch: boolean,
  retries = 2,
  delayMs = 1200
): Promise<any[]> {
  try {
    const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
      params: {
        query,
        page: 1,
        num_pages: 1,
        date_posted: "all",
        remote_jobs_only: isRemoteSearch ? "true" : "false",
      },
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": env.RAPIDAPI_KEY,
      },
      timeout: 20000, // 20 seconds timeout to handle crawler delay
    });

    if (response.data && Array.isArray(response.data.data)) {
      logger.info(`JSearch fetched ${response.data.data.length} results for query: "${query}" (remote: ${isRemoteSearch})`, { source: "scraper" });
      return response.data.data;
    }
    return [];
  } catch (err: any) {
    const status = err.response ? err.response.status : null;
    logger.warn(`JSearch API call failed for query "${query}": status ${status || err.message}`, { source: "scraper" });

    // Retry on 429 rate limit
    if (status === 429 && retries > 0) {
      logger.info(`Rate limit hit for query "${query}". Retrying in ${delayMs}ms...`, { source: "scraper" });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchSourceWithRetry(query, isRemoteSearch, retries - 1, delayMs * 1.5);
    }

    return []; // fail gracefully to keep other parallel requests alive
  }
}

// POST /jobs - Search for jobs on welfound, instahyre, and naukri via JSearch
router.post("/jobs", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  
  const { role, location, experience } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Role/title search parameter is required." });
  }

  // Enforce rate limit: 3 job searches per day per user (Pro and Free alike)
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const count = await ActivityLog.countDocuments({
      userId: req.user.id,
      type: "job_search",
      createdAt: { $gte: startOfToday }
    });

    if (count >= 3) {
      return res.status(403).json({
        error: "Daily job search limit reached.",
        code: "LIMIT_JOB_SEARCH_EXCEEDED",
        message: "You are limited to 3 job searches per day."
      });
    }
  } catch (err) {
    logger.error("Error checking job search limit:", err);
  }

  // Define target career sites/publishers
  const sources = ["naukri", "instahyre", "wellfound"];

  logger.info(`Starting JSearch job search for role: "${role}", location: "${location || 'Any'}", exp: "${experience || 'Any'}"`, { source: "scraper", userId: req.user.id });

  try {
    const isRemoteSearch = location && location.toLowerCase().trim() === "remote";

    const searchPromises = sources.map(async (source) => {
      // Build location component (only if not searching for remote)
      const locationTerm = (location && !isRemoteSearch) ? ` in ${location}` : "";
      
      // Build experience component
      let expTerm = "";
      if (experience === "Entry-level") {
        expTerm = "entry level ";
      } else if (experience === "Mid-level") {
        expTerm = "mid level ";
      } else if (experience === "Senior-level") {
        expTerm = "senior ";
      }

      // Build target query
      const query = `${expTerm}${role}${locationTerm} via ${source}`;
      return fetchSourceWithRetry(query, isRemoteSearch);
    });

    const results = await Promise.all(searchPromises);
    const allJobs = results.flat();

    // Log the successful search activity
    try {
      await activityQueries.add(req.user.id, "job_search", `Searched jobs for role: ${role}`);
    } catch (err) {
      logger.error("Error saving job search activity log:", err);
    }

    // Map the JSearch response schema to the format expected by the frontend
    const mappedJobs = allJobs.map((job: any) => {
      // Format location
      let loc = "India";
      if (job.job_is_remote) {
        loc = "Remote";
      } else {
        const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
        if (parts.length > 0) {
          loc = parts.join(", ");
        } else if (location) {
          loc = location;
        }
      }

      // Format experience
      let exp = "Not specified";
      if (job.job_required_experience?.required_experience_in_months) {
        const yrs = Math.ceil(job.job_required_experience.required_experience_in_months / 12);
        exp = `${yrs} year${yrs > 1 ? "s" : ""}`;
      } else if (job.job_required_experience?.no_experience_required) {
        exp = "Entry-level";
      } else if (experience) {
        exp = experience;
      }

      // Format salary
      let sal = "";
      if (job.job_min_salary && job.job_max_salary) {
        sal = `${job.job_salary_currency || "₹"} ${job.job_min_salary.toLocaleString()} - ${job.job_max_salary.toLocaleString()} / ${job.job_salary_period || "yr"}`;
      } else if (job.job_min_salary) {
        sal = `From ${job.job_salary_currency || "₹"} ${job.job_min_salary.toLocaleString()} / ${job.job_salary_period || "yr"}`;
      } else if (job.job_max_salary) {
        sal = `Up to ${job.job_salary_currency || "₹"} ${job.job_max_salary.toLocaleString()} / ${job.job_salary_period || "yr"}`;
      }

      // Format skills & requirements
      const skills: string[] = Array.isArray(job.job_required_skills) && job.job_required_skills.length > 0 
        ? job.job_required_skills.slice(0, 3) 
        : (Array.isArray(job.job_highlights?.Qualifications) ? job.job_highlights.Qualifications.slice(0, 2) : []);

      return {
        id: job.job_id || Math.random().toString(36).substr(2, 9),
        title: job.job_title || role,
        company: job.employer_name || "Unknown Company",
        location: loc,
        source: job.job_publisher || "JSearch",
        url: job.job_apply_link || "",
        experience: exp,
        salary: sal || "Salary Undisclosed",
        skills,
      };
    });

    // Deduplicate jobs by URL and title+company combo
    const seen = new Set<string>();
    const uniqueJobs = mappedJobs.filter((job) => {
      const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
      if (seen.has(key) || (job.url && seen.has(job.url))) {
        return false;
      }
      seen.add(key);
      if (job.url) seen.add(job.url);
      return true;
    });

    res.json({
      isLive: true,
      jobs: uniqueJobs,
    });
  } catch (error: any) {
    logger.error("Scraper handler encountered a fatal error", { error: String(error), userId: req.user.id, source: "scraper" });
    res.status(500).json({ error: "Failed to scrape jobs from career portals." });
  }
});

export default router;
