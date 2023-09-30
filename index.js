const express = require('express');
const app = express();
const axios = require('axios')
const _ = require('lodash');

const fetchBlogStats = async() => {
    try {
        const headers = {
            "x-hasura-admin-secret": "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6"
        };
        const response = await axios.get("https://intent-kit-16.hasura.app/api/rest/blogs", {headers});
        if(response.status<200 || response.status>299) {
            throw new Error(`Failed to fetch data from the external API. Status: ${response.status}`)
        }
        if(!Array.isArray(response.data.blogs)) {
            throw new Error('Invalid data received from the external API');
        }
        const blogsWithPrivacy = _.filter(response.data.blogs, (blog) => _.includes(blog.title.toLowerCase(), 'privacy'));
        const uniqueBlogTitles = _.uniqBy(response.data.blogs, 'title');
        const data = {
            "Total number of blogs": response.data.blogs.length,
            "The title of the longest blog": (_.maxBy(response.data.blogs, 'title.length')).title,
            "Number of blogs with 'privacy' in the title": blogsWithPrivacy.length,
            "Array of unique blog titles:": uniqueBlogTitles.map((blog) => blog.title)
            };
        return data;
    } catch (err) {
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            console.error('Error: Unable to connect to the external API. Please try again later.');
        } else {
            console.error(`Error during data retrieval or analysis: ${err.message}`);
        }
    }
}

const fetchBlogSearch = async(query) => {
    try {
        const headers = {
            "x-hasura-admin-secret": "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6"
        };
        const response = await axios.get("https://intent-kit-16.hasura.app/api/rest/blogs", {headers});
        if(response.status<200 || response.status>299) {
            throw new Error(`Failed to fetch data from the external API. Status: ${response.status}`)
        }
        if(!Array.isArray(response.data.blogs)) {
            throw new Error('Invalid data received from the external API');
        }
        const sanitizedQuery = query.toLowerCase();
        const filteredBlogs = _.filter(response.data.blogs, (blog) => {
            const blogData = `${blog.title} ${blog.content} ${blog.author}`.toLowerCase();
            return _.includes(blogData, sanitizedQuery);
        });
        return filteredBlogs;
    } catch (err) {
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            console.error('Error: Unable to connect to the external API. Please try again later.');
        } else {
            console.error(`Error during data retrieval or analysis: ${err.message}`);
        }
    }
}
app.get('/api/blog-stats', async (req, res)=>{
    const response = _.memoize(fetchBlogStats);
    response().then((data) => {
        res.send(data);
    }).catch((err) =>{
        console.error(err);
    })
})

app.get('/api/blog-search', async(req, res) => {
   const response = _.memoize(()=>fetchBlogSearch(req.query.query));
   response().then((data) => {
        res.send(data);
   }).catch((err) => {
        console.error(err);
   })
})

app.listen(8000,()=>{
    console.log("Server running at 8000")
})