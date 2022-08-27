function updates(fields,conditions,req){
    //fields should be an array of keys to be updated
    //conditions is a string, in case the key to be updated is nested in the document
    let updates = {};
    fields.map(function (e) {
        if (req.body[e]) {
            return updates[conditions + e] = req.body[e];
        }
    });
    return updates
}

// module.exports allows other files to use the code here i guess?
module.exports={
    updates //'connect':connect - key is same as variable
} 