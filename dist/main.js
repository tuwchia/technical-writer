var $gXNCa$express = require("express");


const $4fa36e821943b400$var$app = $gXNCa$express();
const $4fa36e821943b400$var$port = 3000;
$4fa36e821943b400$var$app.get('/', (req, res)=>{
    res.json({
        "message": "Welcome to Technical Writer!",
        "version": '1.0.0'
    });
});
$4fa36e821943b400$var$app.listen($4fa36e821943b400$var$port, ()=>{
    console.log(`Serving at port ${$4fa36e821943b400$var$port}`);
});


//# sourceMappingURL=main.js.map
