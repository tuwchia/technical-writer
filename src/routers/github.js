const express = require('express');
const router = express.Router();

// List PRs
router.get('/repos/:owner/:repo/pulls', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const searchParams = req.query || {};

        const endpoint = new URL(`https://api.github.com/repos/${owner}/${repo}/pulls`);

        if (searchParams.state) endpoint.searchParams.append('state', searchParams.state);
        if (searchParams.head) endpoint.searchParams.append('head', searchParams.head);
        if (searchParams.sort) endpoint.searchParams.append('sort', searchParams.sort);
        if (searchParams.direction) endpoint.searchParams.append('direction', searchParams.direction);
        if (searchParams.per_page) endpoint.searchParams.append('per_page', searchParams.per_page);
        if (searchParams.page) endpoint.searchParams.append('page', searchParams.page);

        const response = await fetch(endpoint.toString(), {
            headers: {
                'Accept': 'application/vnd.github+json',
                ...(process.env.PERSONAL_ACCESS_TOKEN ? { 'Authorization': `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}` } : {}),
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List commits in a PR
router.get('/repos/:owner/:repo/pulls/:pull_number/commits', async (req, res) => {
    try {
        const { owner, repo, pull_number } = req.params;
        const searchParams = req.query || {};

        const endpoint = new URL(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/commits`);

        if (searchParams.per_page) endpoint.searchParams.append('per_page', searchParams.per_page);
        if (searchParams.page) endpoint.searchParams.append('page', searchParams.page);

        const response = await fetch(endpoint.toString(), {
            headers: {
                'Accept': 'application/vnd.github+json',
                ...(process.env.PERSONAL_ACCESS_TOKEN ? { 'Authorization': `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}` } : {}),
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// List impacted files in a PR
router.get('/repos/:owner/:repo/pulls/:pull_number/files', async (req, res) => {
    try {
        const { owner, repo, pull_number } = req.params;
        const searchParams = req.query || {};

        const endpoint = new URL(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`);

        if (searchParams.per_page) endpoint.searchParams.append('per_page', searchParams.per_page);
        if (searchParams.page) endpoint.searchParams.append('page', searchParams.page);

        const response = await fetch(endpoint.toString(), {
            headers: {
                'Accept': 'application/vnd.github+json',
                ...(process.env.PERSONAL_ACCESS_TOKEN ? { 'Authorization': `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}` } : {}),
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;