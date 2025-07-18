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

async function getPRDiff(prNumber) {
    const res = await githubApi.get(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3.diff'
        }
    });
    return res.data;
}

async function commentOnPR(prNumber, comment) {
    // Get the PR to find the issue number (PRs are issues in GitHub API)
    // But the PR number is the same as the issue number for comments
    await githubApi.post(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${prNumber}/comments`, {
        body: comment
    });
}

async function approvePR(prNumber) {
    // Approve the PR by submitting a review
    await githubApi.post(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}/reviews`, {
        event: 'APPROVE',
        body: 'Approved by SlackMeNot bot.'
    });
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

module.exports = { getOpenPRs, getPRDiff, commentOnPR, approvePR };

