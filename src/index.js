const express = require('express');
const app = express();

// routers
const github = require('./routers/github.js');
const feishu = require('./routers/feishu.js');

const port = 3000;

app.get('/', (req, res) => {
    res.json({
        "message": "Welcome to Technical Writer!",
        "version": '1.0.0'
    })
});

app.use('/github', github);
app.use('/feishu', feishu);

app.listen(port, () => {
    console.log(`Serving at port ${port}`)
})