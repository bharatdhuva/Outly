import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const apiKey = process.env.RAPIDAPI_KEY;
console.log("Using API Key:", apiKey ? `${apiKey.substring(0, 5)}...` : "None");

async function testEndpoint(endpoint: string) {
  try {
    console.log(`Testing endpoint: ${endpoint}...`);
    const response = await axios.get(`https://jsearch.p.rapidapi.com/${endpoint}`, {
      params: {
        query: "Backend Engineer",
        page: 1,
        num_pages: 1,
      },
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      timeout: 10000,
    });
    console.log(`Success on ${endpoint}! Status:`, response.status);
    console.log(`Data count:`, response.data?.data?.length);
  } catch (err: any) {
    console.log(`Failed on ${endpoint}:`, err.response ? err.response.status : err.message);
    if (err.response) {
      console.log(`Response details:`, err.response.data);
    }
  }
}

async function testQuery(q: string) {
  try {
    console.log(`Testing query: "${q}"...`);
    const response = await axios.get("https://jsearch.p.rapidapi.com/search-v2", {
      params: {
        query: q,
        page: 1,
        num_pages: 1,
      },
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      timeout: 15000,
    });
    const jobs = response.data?.data?.jobs || [];
    console.log(`- Success! Jobs count: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log(`  First job publisher: ${jobs[0].job_publisher}`);
    }
  } catch (err: any) {
    console.log(`- Failed:`, err.response ? err.response.status : err.message);
  }
}

async function runTests() {
  await testQuery("Frontend Developer in Bengaluru");
  await testQuery("Frontend Developer in Bengaluru naukri");
  await testQuery("Frontend Developer in Bengaluru instahyre");
  await testQuery("Frontend Developer in Bengaluru wellfound");
}

runTests();
