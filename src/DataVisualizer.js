import {sketch} from 'p5js-wrapper';

// This is the location of commons by default
const LATITUDE = "51.38"
const LONGITUDE = "-2.44"

const DEBUG_MODE = false; // Forces the use of the fallback data to allow testing of other weather conditions

const FALLBACK_DATA = {"time":1747818000,
  "interval":900,
  "temperature_2m":10.9,
  "is_day":1,
  "cloud_cover":100,
  "precipitation":1.10,
  "wind_speed_10m":6.9,
  "rain":0.00,
  "snowfall":1.10}

let weather_data;
let raindrops = [];

class Raindrop {
  x;
  y;
  xv;
  yv;
  snow;
  constructor(x, y, xv, yv, snow) {
    this.x = x;
    this.y = y;
    this.xv = xv;
    this.yv = yv;
    this.snow = snow;
    console.log(snow);
  }

  fall() {
    this.x += this.xv * ((Math.random() / 5) + 0.8);
    if (this.x > windowWidth)
      this.x -= windowWidth;
    this.y += this.yv;
    if (this.y > windowHeight)
      this.y -= windowHeight;
  }

  draw() {
    push();
    if(!this.snow)
      stroke(240, 89, 72, 0.5);
    else
      stroke(100, 0, 100, 0.5);
    strokeWeight(2);
    line(this.x, this.y, this.x + this.xv, this.y + this.yv);
    pop();
  }
}

sketch.setup = function () {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSL);
  angleMode(DEGREES);
}

sketch.preload = function () {
  if(!DEBUG_MODE) {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + LATITUDE + "&longitude=" + LONGITUDE + "&current=temperature_2m,is_day,cloud_cover,precipitation,wind_speed_10m,rain,snowfall&timeformat=unixtime&wind_speed_unit=mph").then((response) => {
      if (response.ok) {
        console.log("Got weather data");
        response.json().then(data => {
          console.log(data);
          weather_data = data.current;
        });
      } else {
        console.log("Failed to fetch weather data, using fallback");
        weather_data = FALLBACK_DATA;
      }
    });
  } else {
    weather_data = FALLBACK_DATA;
  }
}

sketch.draw = function () {
  if(!weather_data){
    return;
  }
  let background_saturation = 90;
  if (weather_data.precipitation) {
    background_saturation -= 40;
  }
  if(weather_data.cloud_cover) {
    background_saturation /= weather_data.cloud_cover;
  }
  let background_luminance = 61;
  if (background_luminance < 1) {
    background_luminance -= 10;
  }
  if (!weather_data.is_day) {
    background_luminance -= 50;
  }

  background(197, background_saturation, background_luminance);

  push(); // Ground
  noStroke();
  fill(32, 80, 13);
  rect(0, windowHeight - 50, windowWidth, 50);
  if (weather_data.snowfall > 0)
    fill(126, 0, 100);
  else
    fill(126, 100, 21);
  rect(0, windowHeight - 60, windowWidth, 10);
  pop();

  push(); // House
  noStroke();
  fill(37, 27, 56); // Beige
  rect(100, windowHeight - 660, 800, 600); // Main body

  fill(37, 27, 46); // Darker Beige
  triangle(100, windowHeight - 660, 500, windowHeight - 860, 900, windowHeight - 660); // Roof

  fill(0, 96, 26); // Dark red
  rect(450, windowHeight - 260, 100, 200); // Door

  fill(42, 96, 50); // Gold
  circle(530, windowHeight - 160, 12) // Door handle

  stroke(150);
  strokeWeight(5);
  fill(240, 100, 15);
  // Ground floor windows
  rect(150, windowHeight - 210, 250, 100);
  rect(150, windowHeight - 210, 60, 100);
  rect(600, windowHeight - 210, 250, 100);
  rect(790, windowHeight - 210, 60, 100);

  // Upper windows
  rect(150, windowHeight - 560, 250, 100);
  rect(150, windowHeight - 560, 60, 100);
  rect(600, windowHeight - 560, 250, 100);
  rect(790, windowHeight - 560, 60, 100);
  rect(450, windowHeight - 600, 100, 180);

  pop();

  if (weather_data.precipitation > 0) {
    if (raindrops.length === 0) {
      let dropsPerRow = weather_data.precipitation * 30;
      let increment = Math.floor(windowWidth / dropsPerRow)
      for (let i = 0; i < windowWidth; i += increment) {
        for (let j = 0; j < windowHeight; j += increment) {
          let randx = Math.random() * (10 - -10) + -10;
          let randy = Math.random() * (10 - -10) + -10;
          let raindrop = new Raindrop(i + randx, j + randy, weather_data.wind_speed_10m, 9.8, weather_data.snowfall > 0); // 9.8 chosen because gravity is 9.8m/s
          raindrops.push(raindrop);
        }
      }
    }

    raindrops.forEach((raindrop, i, arr) => {
      raindrop.draw();
      raindrop.fall();
    });
  }
}