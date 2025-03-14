import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getTokens, setTokens } from '../utils/tokenStore.js';

dotenv.config();


/**
 * TONGOU SERVER
 * 
 */
const end_point_ogemray = process.env.END_POINT_OGEMRAY;
const grand_type = process.env.GRANT_TYPE;
const code = process.env.CODE;
const client_id = process.env.CLIENT_ID;
const sign_method = process.env.SIGN_METHOD;
const key_tongou = process.env.KEY_TONGOU;
const user_id = process.env.USER_ID;

export const getTokenTongou = async (req, res) => {
  try {
    // console.log("axios : ",axios);
    const method = 'GET';
    const url = `/v1.0/authorize_token?code=${code}&grant_type=${grand_type}`;
    const access_token = "";
    const body = "";
    const Content_SHA256 = crypto.createHash('sha256').update(body, 'utf8').digest('hex');
    const d = new Date();
    
    const time_str = Date.now().toString();
    
    const string_to_sign = `${method}\n${Content_SHA256}\n\n${url}`;
    const str_1 = `${client_id}${access_token}${time_str}${string_to_sign}`;
    const sign = crypto.createHmac('sha256', key_tongou).update(str_1, 'utf8').digest('hex').toUpperCase();

    
    const headers = {
      'client_id': client_id,
      'sign': sign,
      't': time_str,
      'sign_method': sign_method,
    };

    // console.log(headers);
    

    console.log("sending request to : ",`${end_point_ogemray}${url}`);
    const response = await axios.get(`${end_point_ogemray}${url}`, { headers });

    // console.log("response.data : ",response.data);
    
    if (response.data.success) {
      const { access_token, refresh_token } = response.data.result;
      setTokens(access_token, refresh_token); // Stocke les tokens pour réutilisation
      response.data.result.sign = sign;
      response.data.result.t = time_str;
      res.status(200).json(response.data);
    } else {
      res.status(500).json({ error: "Echec d'obtention du token" });
    }

  } catch (error) {
    console.error("Erreur lors de la génération du token:", error);
    res.status(500).json({ error: "Erreur lors de la génération du token" });
  }
};



export async function GenerateSign(access_token, body, client_id, key, url, method) {  
  if(access_token == null) return null;
  url = reorganisedUrl(url);
  
  if (body !== "") {
    body = JSON.stringify(body);
    
  }
  
  

  const Content_SHA256 = crypto.createHash('sha256').update(body, 'utf8').digest('hex');


  const time_str = Date.now().toString();
  const string_to_sign = `${method}\n${Content_SHA256}\n\n${url}`;
  const str_1 = `${client_id}${access_token}${time_str}${string_to_sign}`;
  const sign = crypto.createHmac('sha256', key).update(str_1, 'utf8').digest('hex').toUpperCase();

  
  const sign_rep = {
    'client_id': client_id,
    'sign': sign,
    't': time_str,
    'sign_method': sign_method,
    'access_token': access_token,
  };
  
  return {sign_rep}
}



export function reorganisedUrl(inputString) {
  const questionMarkIndex = inputString.indexOf("?");
  if (questionMarkIndex === -1) {
      return inputString; 
  }

  const beforeQuestionMark = inputString.slice(0, questionMarkIndex);

  const partToProcess = inputString.slice(questionMarkIndex + 1);

  const parts = partToProcess.split("&");

  const sortedParts = parts.filter(Boolean).sort();

  let resultString = "";
  sortedParts.forEach((part, index) => {
      resultString += part;
      if (index < sortedParts.length - 1) {
          resultString += "&";
      }
  });

  return `${beforeQuestionMark}?${resultString}`;
}


export const getAssetsInformation = async (req, res) => {
  try {
    let isValid = false;
    let response = {};
    let retries = 0; 

    while (!isValid && retries < 3) {
      let tokens = getTokens();

      // Vérifier si le token est manquant ou invalide
      if (tokens.accessToken === null || response?.data?.msg === "token invalid") {
        
        try {
          await axios.get(`${port_ecozipo}/gettokentongou`);
          tokens = getTokens();
          
        } catch (error) {
          return res
            .status(500)
            .json({ messageError: "Vous êtes hors ligne, veuillez vérifier votre connexion!" });
        }
      }
      const method = "GET";
      const url = `/v1.0/cloud/energy/micro/assets?user_id=${user_id}`
      const access_token = tokens.accessToken;
      const body = "";

      const generateSign = await GenerateSign(access_token, body, client_id, key_tongou, url, method);

      const headers = {
        client_id: generateSign.sign_rep.client_id,
        access_token: generateSign.sign_rep.access_token,
        sign: generateSign.sign_rep.sign,
        t: generateSign.sign_rep.t,
        sign_method: generateSign.sign_rep.sign_method,
      };

      try {
        response = await axios.get(`${end_point_ogemray}${url}`, { headers });

        if (response.data.success) {
          isValid = true; 
        } else {
          console.error("Response error:", response.data.msg);
          retries++;
        }
      } catch (error) {
        console.error("Request error:", error.message);
        retries++;
      }
      console.log("response.data : ",response.data);
    }

    if (isValid) {
      return res.status(200).json(response.data);
    } else {
      return res
        .status(400)
        .json({ messageError: "Impossible de récupérer les données après plusieurs tentatives." });
    }
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res.status(500).json({
      messageError: "Erreur lors de la récupération des données.",
      error: error.message,
    });
  }
};



/**
 * OGEMRAY SERVER
 * 
 */
const API_KIT = process.env.API_KIT;
const ENTREPRISE_CODE = process.env.ENTREPRISE_CODE;
const AUTHORITZE_CODE = process.env.AUTHORITZE_CODE;

export const getTokenByKit = async (req, res) => {
  try {
    // Obtenir le temps actuel en secondes depuis l'époque Unix
    const req_time_long_10 = Math.floor(Date.now() / 1000);

    // Obtenir le temps actuel en millisecondes depuis l'époque Unix
    const req_time_long_13 = Date.now();

    // Chaîne de texte à hacher
    const EnterpriseCode = ENTREPRISE_CODE;
    const ReqTime = req_time_long_13;
    const AuthoritzeCode = AUTHORITZE_CODE;

    const Signature = EnterpriseCode + ReqTime + AuthoritzeCode;

    // hachage MD5
    const md5_hash = crypto.createHash('md5');

    // Mettre à jour l'objet MD5 avec la chaîne encodée
    md5_hash.update(Signature);

    // Obtenir le hachage en hexadécimal
    const Signature2 = md5_hash.digest('hex');

    // Construire l'URL avec les paramètres requis
    const apiUrl = `${API_KIT}/api/Authorization?EnterpriseCode=${EnterpriseCode}&ReqTime=${ReqTime}&Signature=${Signature2}`;

    const response = await axios.get(apiUrl);

   
    const token = response.data.Data.Token; 
    const expired = response.data.Data.Expired;
    
    let data = {
      req_time_long_10,
      req_time_long_13,
      signature: Signature2,
      token: token,
      expired: expired
    };

    res.status(201).json(data);
  } catch (error) {
    // console.error("Erreur lors de la requête vers l'API: de-openapi.ogemray-server.com, Veuillez vérifier votre connexion!");
    return res.status(500).json({ messageError: "Vous êtez hors ligne, Veuillez vérifier votre connexion!" });
  }
};



export const decodeTime = async (req, res) => {
  const time = req.body.time;
  const date = new Date(parseInt(time) * 1000);

  res.json({Time : date.toLocaleString()})
};

export async function decodeTimeFunction (time) {
  const date = new Date(parseInt(time) * 1000);
  const Time = date.toLocaleString()
  return {Time : Time}
};


export const encodeTime = async (req, res) => {
  const time = req.body.time;

  // Convertir en date ISO format explicite
  const date = new Date(Date.parse(time.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')));
  
  // Convertir en timestamp Unix
  const timestamp = Math.floor(date.getTime() / 1000);

  res.json({ Time: timestamp.toString().slice(0, 10) });
};


export async function encodeTimeFunction (time) {

  const date = new Date(Date.parse(time.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')));

  const timestamp = Math.floor(date.getTime() / 1000);
  const Time = timestamp.toString().slice(0, 10)
  return { Time: Time };
};





