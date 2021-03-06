var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var ref = require("ref");
var ffi = require("ffi");
var request = require('request');
var PushBullet = require('pushbullet');
var pusher = new PushBullet('o.uVt9MGVImy0pCIwDuZhWddPHvlfgO9a9');

var floatPtr = ref.refType('float');
var thermostatLib = ffi.Library('./thermostatLibrary', {
  'pi_dht_read': ['int', ['int', 'int', floatPtr, floatPtr]]
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// catch 404 and forward to error handler


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function GetTempData(){
  return new Promise(async (resolve, reject) => {
    let humidityPtr = ref.alloc('float');
    let tempPtr = ref.alloc('float');
    let result = thermostatLib.pi_dht_read(22, 4, humidityPtr, tempPtr);
    /*while(result != 0){
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
      result = thermostatLib.pi_dht_read(22, 4, humidityPtr, tempPtr);
    }*/
    let indoorHumidity = humidityPtr.deref();
    let indoorTemp = tempPtr.deref();

    let outdoorTemp;
    let outdoorHumidity;
    let windSpeed;
    let error = false;
    let tempInfo = new Object();
    await request('http://api.openweathermap.org/data/2.5/weather?id=5967629&units=metric&APPID=a170393ea0ca150f33084c7b01975529', (err, res, body) => {
      if(err){
        reject(err);
        return;
      }
      body = JSON.parse(body);
      outdoorTemp = body.main.temp;
      outdoorHumidity = body.main.humidity;
      windSpeed = body.wind.speed;

      // https://en.wikipedia.org/wiki/Wind_chill#North_American_and_United_Kingdom_wind_chill_index
      let indoorAT;
      let outdoorAT;

      let indoorE = (indoorHumidity / 100) * 6.105 * Math.pow(Math.E, ((17.17 * indoorTemp) / (237.7 + indoorTemp)));
      let outdoorE = (outdoorHumidity / 100) * 6.105 * Math.pow(Math.E, ((17.17 * outdoorTemp) / (237.7 + outdoorTemp)));

      indoorAT = indoorTemp + (0.33 * indoorE) - 4;
      outdoorAT = outdoorTemp + (0.33 * outdoorE) - (0.7 * windSpeed) - 4;
      tempInfo.indoorAT = indoorAT.toFixed(2);
      tempInfo.outdoorAT = outdoorAT.toFixed(2);
      tempInfo.outdoorTemp = outdoorTemp.toFixed(2);
      tempInfo.indoorTemp = indoorTemp.toFixed(2);
      resolve(tempInfo);
    });
  });
}

module.exports = GetTempData;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

let winterMode = false;
let windowsOpen = false;
setInterval(() => {
  console.log("interval");
  GetTempData().then((tempData) => {
    let indoorAT = tempData.indoorAT;
    let outdoorAT = tempData.outdoorAT;
    let indoorTemp = tempData.indoorTemp;
    let outdoorTemp = tempData.outdoorTemp;
    if(!winterMode){
      if(indoorAT > outdoorAT && windowsOpen == false){
        //open
        pusher.note({}, 'Open the windows!', `Outdoor actual temp: ${outdoorTemp}
        Outdoor feels like: ${outdoorAT}
        Indoor actual temp: ${indoorTemp}
        Indoor feels like: ${indoorAT}`, (err, res) => {if(err) console.log(err); if(res) console.log(res)});
        windowsOpen = true;
      }
      if(indoorAT < outdoorAT && windowsOpen == true){
        //close
        pusher.note({}, 'Close the windows!', `Outdoor actual temp: ${outdoorTemp}
        Outdoor feels like: ${outdoorAT}
        Indoor actual temp: ${indoorTemp}
        Indoor feels like: ${indoorAT}`, (err, res) => {if(err) console.log(err); if(res) console.log(res)});
        windowsOpen = false;
      }
    }else{
      if(indoorAT < outdoorAT && windowsOpen == false){
        //open
        pusher.note({}, 'Open the windows!', `Outdoor actual temp: ${outdoorTemp}
        Outdoor feels like: ${outdoorAT}
        Indoor actual temp: ${indoorTemp}
        Indoor feels like: ${indoorAT}`, (err, res) => {if(err) console.log(err); if(res) console.log(res)});
        windowsOpen = true;
      }
      if(indoorAT > outdoorAT && windowsOpen == true){
        //close
        pusher.note({}, 'Close the windows!', `Outdoor actual temp: ${outdoorTemp}
        Outdoor feels like: ${outdoorAT}
        Indoor actual temp: ${indoorTemp}
        Indoor feels like: ${indoorAT}`, (err, res) => {if(err) console.log(err); if(res) console.log(res)});
        windowsOpen = false;
      }
    }
  }).catch();
}, 900000);
module.exports = app;
