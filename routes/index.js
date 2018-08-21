var express = require('express');
var router = express.Router();
var GetTempData = require('../app');
/* GET home page. */
router.get('/', async function(req, res, next) {
  GetTempData().then((tempData) => {
    res.render('index', { indoorAT: tempData.indoorAT,
                        outdoorAT: tempData.outdoorAT,
                        indoorTemp: tempData.indoorTemp,
                        outdoorTemp: tempData.outdoorTemp });
  }).catch((err) => {
    console.log(err);
  });
  
});

module.exports = router;
