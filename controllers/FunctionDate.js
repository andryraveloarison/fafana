import { config } from 'dotenv';

config();





export function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Ajouter un zéro si nécessaire
  const day = String(date.getDate()).padStart(2, '0'); // Ajouter un zéro si nécessaire
  return `${year}${month}${day}`;
}


export function formatYYYYMMDDtoDate(date) {
  let year = parseInt(date.substring(0, 4));
  let month = parseInt(date.substring(4, 6)) - 1; // Les mois sont 0-indexés
  let day = parseInt(date.substring(6, 8));


  return new Date(year, month, day);
}


export function formatYYYYMMDDtoDateAndHours(dateNumber) {
  let dateString = dateNumber.toString(); // Convertir en chaîne
  let year = dateString.slice(0, 4); // Année : "2025"
  let month = dateString.slice(4, 6); // Mois : "02"
  let day = dateString.slice(6, 8); // Jour : "14"
  let hour = dateString.slice(8, 10) || "00"; // Heure : "01" (ou 00 si absent)

  let date = new Date(`${year}-${month}-${day}T${hour}:00:00.000Z`);
  return date;
}

