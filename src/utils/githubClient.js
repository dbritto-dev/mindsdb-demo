require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'dbritto-dev'; // your username
const REPO_NAME = 'mindsdb-demo'; // your repo

const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json'
    }
});

async function getOpenPRs(branch = 'main') {
    const res = await githubApi.get(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=open&base=${branch}`);
    return res.data;
}

// Example usage: fetch and log open PRs
if (require.main === module) {
    (async () => {
        try {
            const prs = await getOpenPRs();
            console.log('Open PRs:');
            prs.forEach(pr => {
                console.log(`#${pr.number}: ${pr.title} (by ${pr.user.login}) - ${pr.html_url}`);
            });
        } catch (err) {
            console.error('Error fetching PRs:', err.message);
        }
    })();
}

module.exports = { getOpenPRs };

