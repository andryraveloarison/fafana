import express from 'express'
import { addWeatherKit, getLocation, getLocationByCity, getMeteo, getUpdateWeatherKit, getWeatherByLongLat } from '../../controllers/Meteo/WeatherController.js';

const router = express.Router()

router.post("/getmeteo", getMeteo)
router.post("/getlocation", getLocation)
router.post('/getlocationbycity', getLocationByCity)
router.post('/getweatherbylonglat', getWeatherByLongLat)
router.post("/addweatherkit", addWeatherKit)
router.post("/getupdateweatherkit", getUpdateWeatherKit)


export default router;