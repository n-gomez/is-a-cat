const express = require('express');
const multer = require('multer');
const path = require('path');
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const router = express.Router();

//Set storage for image
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function(req, file, cb){
    cb(null, "image.jpeg");
  }
});

// Initialize image upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1024 * 1024 * 6},
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
         msg: 'Please ensure the file size is less than 6 MB. Type must be jpeg, jpg, png or gif.'
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
                      "maxResults":30
                    }
                  ]
                }
              ]
            }
          }).then(function(response) {           
             let lbls = JSON.parse(JSON.stringify(response.data)).responses[0].labelAnnotations;
             console.log(lbls);

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
                      catMsg = 'this image has a cat!!';
                      break;
                    case (isCatPercent >= .65):
                      catMsg = 'this image likely has a cat.';
                      break;
                    case (isCatPercent >= .35):
                      catMsg = 'this image might have a cat.';
                      break;
                    case (isCatPercent >= .10):
                      catMsg = 'it\'s unilekly for this image to have a cat.';
                      break;
                    case (isCatPercent < .10):
                      catMsg = 'most likely this image does NOT have a cat.';
                      break;
                    default: 
                      catMsg = 'no cat here!';
                      break;
                  }
                } else {
                    catMsg = `this image does NOT have a cat =(`;
                }
                  res.render('index', {
                    msg: `The score is ${Number.parseFloat(catScore* 100).toFixed(2)}%. Based on Google's score, ${catMsg}`,
                    file: `uploads/${req.file.filename}`
                  });

             }
             isCat(lbls);
          });
       }};
    });
});

module.exports = router;