import axios from "axios";
import { config } from 'dotenv';

config();

const port_ecozipo = process.env.PORT_ECOZIPO;


// tokenStore.js
let accessToken = null;
let refreshToken = null;
let tokenTimestamp = null;  

const TOKEN_EXPIRY_TIME = 2 * 60 * 60 * 1000;  

export const setTokens = (newAccessToken, newRefreshToken) => {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  tokenTimestamp = Date.now();  
};

const checkTokenExpiration = async () => {
  if (accessToken === null && tokenTimestamp === null) {
    
    const currentTime = Date.now();
    if (currentTime - tokenTimestamp > TOKEN_EXPIRY_TIME) {
      accessToken = null;  

      try {
        await axios.get(`${port_ecozipo}/gettokentongou`);
      } catch (error) {
        console.error("Erreur lors de la récupération du token :", error);
      }
    }
  }
};

export const getTokens = () => {
  checkTokenExpiration();  
  
  return {
    accessToken,
    refreshToken,
  };
};


// let accessToken = null;
// let refreshToken = null;

// export const setTokens = (newAccessToken, newRefreshToken) => {
//   accessToken = newAccessToken;
//   refreshToken = newRefreshToken;
// };

// export const getTokens = () => ({
//   accessToken,
//   refreshToken,
// });