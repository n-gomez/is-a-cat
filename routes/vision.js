const express = require('express');
const multer = require('multer');
const path = require('path');
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const router = express.Router();
let lbls = [];

// Set storage
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function(req, file, cb){
    cb(null, "image.jpeg");
  }
});
  
// Initialize image upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1024 * 1024 * 4},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('image');
  
// Validate the file type
function checkFileType(file, cb){
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if(mimetype && extname){
     return cb(null,true);
  } else {
     cb('Error: Images Only! Please upload jpeg, jpg, png or gif.');
  }
}

// Posts route /upload, adding the uploaded file
router.post('/upload', (req, res) => {
    upload(req, res, (err) => {
      if(err){
        res.render('index', {
          msg: err
        });
      } else {
          if(req.file == undefined) {
              res.render('index', {
                  msg: 'Error: No File Selected! Please click on File and upload an image file (jpeg, jpg, png or gif).'
              });
          } else {

          let bitmap = fs.readFileSync('./public/uploads/image.jpeg');
          axios({
              method: 'post',
              url: 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAwlxdvFNNQvtMCUrjTgmq6YBXdOkZ-f6I',
              data: {
              "requests":[
                {
                  "image": {
                    "content": new Buffer.from(bitmap).toString('base64')
                  },
                  "features":[
                    {
                      "type":"LABEL_DETECTION",
                      "maxResults":1
                    }
                  ]
                }
              ]
            }
            }).then(function(response) {           
                lbls = JSON.parse(JSON.stringify(response.data)).responses[0].labelAnnotations;
                console.log(lbls);
                fs.writeFile("./public/uploads/response.txt",JSON.stringify(response.data),'utf8', function(err) { 
                    if (err) {
                             console.log('File did not successfully write to file.');
                             return console.log(err);
                         }
                         //return console.log(`Line 78 ==========> ${labels()}`);
                     });
                     //return console.log(`Line 80 =========> ${labels()}`);
           })
          res.render('index', {
            msg: isCat(lbls),
            file: `uploads/${req.file.filename}`
          });
      }}
    });
});
console.log(isCat(lbls));
function isCat(labelObj) {
    let catScore = 0;
    let isCatPercent = labelObj.some(function(label) {
        let description = Object.entries(label)[1][1];
        let score = Object.entries(label)[2][1];
        
        if(description === 'Cat') {
            catScore = score;
            return catScore;
        }
    });
    console.log(`Catscore is ======> ${catScore}`);
    if(catScore) {
        switch (true) {
          case (isCatPercent >= .90):
            catMsg = 'This image has a cat!!';
            break;
          case (isCatPercent >= .65):
            catMsg = 'This image likely has a cat.';
            break;
          case (isCatPercent >= .35):
            catMsg = 'This image might have a cat.';
            break;
          case (isCatPercent >= .10):
            catMsg = 'It\'s unilekly for this image to have a cat.';
            break;
          case (isCatPercent < .10):
            catMsg = 'Most likely this image does NOT have a cat.';
            break;
          default: 
            catMsg = 'No cat here!';
            break;
        }
    } else {
        catMsg = `This image does NOT have a cat =(`;
    }
    return `The score is ${Number.parseFloat(catScore* 100).toFixed(2)}%. ${catMsg}`;
}

function labels(){
    return JSON.parse(fs.readFileSync('./public/uploads/response.txt','utf8')).responses[0].labelAnnotations;
}

module.exports = router;