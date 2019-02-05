const fs = require('fs');

module.exports = function analysis() {
    this.labels = JSON.parse(fs.readFileSync('./public/uploads/response.txt','utf8')).responses[0].labelAnnotations;
    this.catMsg = function(labelObj) {
        let catScore = 0;
        let isCatPercent = labelObj.some(function(label) {
        let description = Object.entries(label)[1][1];
        let score = Object.entries(label)[2][1];
            
        if(description === 'Cat') {
            catScore = score;
            return catScore;
        }
        });
        console.log(`Catscore is ===> ${catScore}`);
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
            catMsg = 'This image does NOT have a cat =(';
        }
        return catMsg;
    };
    this.msg = catMsg(this.labels);
};



