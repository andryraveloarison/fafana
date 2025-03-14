import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv';
import axios from 'axios'
import geoip from 'geoip-lite';

config();

const prisma = new PrismaClient()
const key_meteo = process.env.KEY_METEO;
const port_ecozipo = process.env.PORT_ECOZIPO;

export const getMeteo = async (req, res)  => {
    const city = req.body.city || 'Antananarivo'; 
  
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key_meteo}&units=metric`
      );
  
      const weatherData = response.data;
      res.json({
        city: weatherData.name,
        temperature: weatherData.main.temp,
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        success: true
      });
    } catch (error) {
      res.status(500).json({ message: error.message, success: false });
    }
}



export const getLocation = async (req, res) => {
  try {
    // Récupérer l'adresse IP du client
    const clientIp = req.body.ip || '154.120.163.250'

    if (!clientIp) {
      return res
        .status(400)
        .json({ message: "Impossible de récupérer l'adresse IP", success: false });
    }

    // Récupérer les informations de géolocalisation
    const geo = geoip.lookup(clientIp);

    if (!geo) {
      return res.status(404).json({
        message: "Impossible de récupérer la localisation",
        success: false,
      });
    }

    let lat = geo.ll[0]
    let lon = geo.ll[1]

    const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key_meteo}&units=metric`
      );
  
    const weatherData = response.data;


    // Renvoyer les données de localisation
    res.json({
        localisation: {
            ip: clientIp,
            country: geo.country,
            region: geo.region,
            city: geo.city,
            latitude: geo.ll[0],
            longitude: geo.ll[1],
            timezone: geo.timezone || null,
        },
        weather: {
            temperature: weatherData.main.temp,
            description: weatherData.weather[0].description,
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind.speed,
        },
        success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};



export const getLocationByCity = async (req, res) => {
  let city = req.body.city || 'Antananarivo';
  const ip = req.body.ip;

  try {
    let getLocation = await axios.post(`${port_ecozipo}/getlocation`, { ip: ip });

    let ipLocation = getLocation.data.localisation?.ip;

    if (!ipLocation) {
      return res.status(400).json({
        message: "Impossible de récupérer la localisation à partir de l'IP",
        success: false,
      });
    }

    if (ipLocation === '154.120.163.250' && city === 'Antananarivo') {
      return res.status(400).json({
        message: "Impossible de récupérer la localisation de votre appareil, veuillez entrer votre ville actuelle!",
        success: false,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la localisation :", error.message);

    return res.status(500).json(error.response?.data || error.message);
  }

  try {
    // Appel à l'API de géocodage d'OpenWeatherMap pour récupérer les coordonnées
    const geocodingResponse = await axios.get(
      `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${key_meteo}`
    );

    if (geocodingResponse.data.length === 0) {
      return res.status(404).json({
        message: "Ville introuvable",
        success: false,
      });
    }

    // Extraire latitude et longitude de la réponse
    const { lat, lon, name, country, state } = geocodingResponse.data[0];

    // Récupérer les informations météorologiques en utilisant les coordonnées
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key_meteo}&units=metric`
    );

    const weatherData = weatherResponse.data;

    // Réponse finale
    res.json({
      localisation: {
        city: name,
        latitude: lat,
        longitude: lon,
        country: country,
        region: state,
      },
      weather: {
        temperature: weatherData.main.temp,
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
      },
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des données météo",
      details: error.response?.data || error.message,
      success: false,
    });
  }
};




export const getWeatherByLongLat = async (req, res) => {

  try {
    const { lat, lon } = req.body;
    if (!lat || !lon) {
      return res.status(400).json({
        message: "Veuillez fournir les coordonnées de la localisation",
        success: false,
      });
    }

    // Récupérer les informations météorologiques en utilisant les coordonnées
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key_meteo}&units=metric`
    );

    const weatherData = weatherResponse.data;

    res.json({
      data: {
        temperature: weatherData.main.temp,
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
      },
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des données météo",
      details: error.response?.data || error.message,
      success: false,
    });
  }
};




export const addWeatherKit = async (req, res) => {
  try {
    let city = req.body.city || 'Antananarivo';
    let ip = req.body.ip ;
    let device_id = req.body.device_id;

    if(!device_id) return res.status(400).json({ message: "Le device_id du kit est obligatoire.", success: false });

    // find device_id
    const kitTongou = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: device_id
      }
    });
    if(!kitTongou) return res.status(404).json({ message: "Le device_id du kit n'existe pas.", success: false });

    let kitTongouId = kitTongou.id;

    // find kitTongouId exist in WeatherKit
    const weatherKit = await prisma.weatherKit.findFirst({
      where: {
        kitTongouId: kitTongouId
      }
    });
    if(weatherKit) return res.status(400).json({ message: `Le kit ${device_id} est déjà associé à une localisation.`, success: false });

    let getLocation = {}

    try { 
      getLocation = await axios.post(`${port_ecozipo}/getlocationbycity`, {ip: ip, city: city});
    } catch (error) {
      return res.status(500).json(error.response?.data || error.message);
    }
    
    let data = getLocation.data;

    // save data in WeatherKit
    const saveWeatherKit = await prisma.weatherKit.create({
      data: {
        kitTongouId: kitTongouId,
        lon: data.localisation.longitude,
        lat: data.localisation.latitude,
        city: data.localisation.city,
        country: data.localisation.country,
        region: data.localisation.region,
        description: data.weather.description,
        humidity: data.weather.humidity,
        temperature: data.weather.temperature,
        windSpeed: data.weather.windSpeed,
      }
    });

    
    
    res.json({
      data: saveWeatherKit,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};



export const getUpdateWeatherKit = async (req, res) => {
  try {
    let device_id = req.body.device_id;
    if(!device_id) return res.status(400).json({ message: "Le device_id du kit est obligatoire.", success: false });

    // find device_id
    const kitTongou = await prisma.kitTongou.findFirst({
      where: {
        idKitTongou: device_id
      }
    });
    if(!kitTongou) return res.status(404).json({ message: "Le device_id du kit n'existe pas.", success: false });

    let kitTongouId = kitTongou.id;

    // find WeatherKit
    const weatherKit = await prisma.weatherKit.findFirst({
      where: {
        kitTongouId: kitTongouId
      }
    });
    if(!weatherKit) return res.status(404).json({ message: "Ce kit n'est pas associé à une météo.", success: false });

    const longitude = weatherKit.lon;
    const latitude = weatherKit.lat;

    // get weather by longitude & latitude
    try { 
      let getWeather = await axios.post(`${port_ecozipo}/getweatherbylonglat`, {lat: latitude, lon: longitude});

      let data = getWeather.data.data;
      

      // update WeatherKit
      if(getWeather.data.success){
        const updateWeatherKit = await prisma.weatherKit.update({
          where: {
            id: weatherKit.id
          },
          data: {
            description: data.description,
            humidity: data.humidity,
            temperature: data.temperature,
            windSpeed: data.windSpeed,
          }
        });
  
        res.json({
          data: updateWeatherKit,
          success: true,
        });
      }
      
    } catch (error) {
      return res.status(500).json(error.response?.data || error.message);
    }
    
    
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};