import { Router } from "express";
import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

const router = Router();

// POST /jobs - Search for jobs on welfound, instahyre, and naukri via JSearch
router.post("/jobs", async (req, res) => {
  const { role, location, experience } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Role/title search parameter is required." });
  }

  // Define target career sites/publishers
  const sources = ["naukri", "instahyre", "wellfound"];

  logger.info(`Starting JSearch job search for role: "${role}", location: "${location || 'Any'}", exp: "${experience || 'Any'}"`, { source: "scraper" });

  try {
    // Run search for each source in parallel
    const searchPromises = sources.map(async (source) => {
      // Build location component
      const locationTerm = location ? ` in ${location}` : "";
      
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

      try {
        const response = await axios.get("https://jsearch.p.rapidapi.com/job-search", {
          params: {
            query,
            page: 1,
            num_pages: 1,
            date_posted: "all",
          },
          headers: {
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
            "x-rapidapi-key": env.RAPIDAPI_KEY,
          },
          timeout: 8000, // 8 seconds timeout per source call
        });

        if (response.data && Array.isArray(response.data.data)) {
          logger.info(`JSearch fetched ${response.data.data.length} results for query: "${query}"`, { source: "scraper" });
          return response.data.data;
        }

        return [];
      } catch (err: any) {
        logger.error(`JSearch API call failed for query "${query}"`, { error: err.message || String(err), source: "scraper" });
        return []; // fail gracefully for this source
      }
    });

    const results = await Promise.all(searchPromises);
    
    // Flatten all results into a single array
    const allJobs = results.flat();

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
        sal = `${job.job_salary_currency || "₹"} ${job.job_min_salary} - ${job.job_max_salary} / ${job.job_salary_period || "year"}`;
      } else if (job.job_min_salary) {
        sal = `Min ${job.job_salary_currency || "₹"} ${job.job_min_salary} / ${job.job_salary_period || "year"}`;
      } else if (job.job_max_salary) {
        sal = `Max ${job.job_salary_currency || "₹"} ${job.job_max_salary} / ${job.job_salary_period || "year"}`;
      }

      return {
        id: job.job_id || Math.random().toString(36).substr(2, 9),
        title: job.job_title || role,
        company: job.employer_name || "Unknown Company",
        location: loc,
        source: job.job_publisher || "JSearch",
        url: job.job_apply_link || "",
        experience: exp,
        salary: sal || "Not specified",
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
    logger.error("Scraper handler encountered a fatal error", { error: String(error), source: "scraper" });
    res.status(500).json({ error: "Failed to scrape jobs from career portals." });
  }
});

export default router;
