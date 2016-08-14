var express = require('express');
var path = require("path");
var mongojs = require("mongojs");
var shortid = require("shortid");
var validUrl = require('valid-url');
var databaseUrl = process.env.MLAB_URI || "shorter-link";
var db = mongojs(databaseUrl, ["links"]);

// Set what characters can be used for id
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');

var app = express();

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + "/index.html"), function(err) {
        if (err) console.log(err);
    });
});

app.get("/:id", function (req,res) {
    var db = mongojs(databaseUrl, ["links"]);
    var id = req.params.id;

    db.links.findOne({
        code: id
    }, function (err, doc) {
        if (doc != null) {
            res.redirect(doc.original);
        } else {
            res.json({ error: "No such code found in database"});
        }
    });
});

app.get("/new/:url(*)", function (req, res) {
    var url = req.params.url;
    var code = shortid.generate();

    var newUrl = {
        original: url,
        shortened: req.get("host") + "/" + code,
        code: code
    }

    if (validUrl.isUri(url)) {
        db.links.insert(newUrl, function(err, result) {
            err ? console.log(err) : console.log("New link added to database")
        });

        // Did it this way because newUrl itself was outputting the Mongo id as well
        res.json({
            original: newUrl.original,
            shortened: newUrl.shortened
        });
    }
    else {
        res.json({
            error: "Not a valid url please make sure to put the protocol (http) and site",
            example: "http://www.google.ca"
        })
    }
});

app.listen(process.env.PORT || 3000, function () {
    console.log('App started');
});
