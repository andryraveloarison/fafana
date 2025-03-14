const contextDescription = `
    Msg : ${data.Msg}
    min : ${data.min} kWh
    valeurEconomiser : ${data.valeurEconomiser}
    tranche : ${data.tranche}
    prixTotal : ${data.prixTotalTTC} Ar TTC
    valeur : ${data.valeur}
    consommationNormal : ${data.consommationNormal} kWh
    prixNormalTotal: ${data.prixTTC} Ar TTC
    consommationJour : ${data.consommationJour} kWh
    consommationHeure : ${data.consommationHeure} kWh

    
    La consommation minimale est ${data.min} kWh. 
    La consommation par tranche indique l'économie possible : 
    - Tranche 1 : 5% à 9% 
    - Tranche 2 : 12% à 15% 
    - Tranche 3 : 20% à 23% 
    - Tranche 4 : 25% à 30%.

    La consommation normale représente le montant à dépenser pour une utilisation standard. 
    La consommation quotidienne est de ${data.consommationJour} kWh, 
    et la consommation horaire est de ${data.consommationHeure} kWh.

    Rôle de l'IA : 
    "L'IA doit reformuler le message \`Msg en tenant compte des données ci-dessus." 
    "Chaque utilisateur doit recevoir un message unique et personnalisé." 

    Type de message :
    "D'après l'analyse de vos 3 dernières factures, votre consommation minimale est de ${data.min} kWh, équivalent à ${data.prixTotalTTC} Ar TTC. Vous pouvez économiser jusqu'à ${data.tranche}% par rapport à votre consommation normale de ${data.consommationNormal} kWh (${data.prixTTC} Ar TTC). Votre consommation doit être de ${data.consommationJour} kWh par jour et ${data.consommationHeure} kWh par heure."
    "Suite à l'examen de vos 3 dernières factures, nous avons déterminé que votre consommation minimale est de ${data.min} kWh, équivalente à ${data.prixTotalTTC} Ar TTC. Vous avez la possibilité d'économiser jusqu'à ${data.tranche}% par rapport à votre consommation normale de ${data.consommationNormal} kWh (${data.prixTTC} Ar TTC). Pour un usage optimal, visez ${data.consommationJour} kWh par jour et ${data.consommationHeure} kWh par heure."
    "Votre consommation minimale est de ${data.min} kWh, soit ${data.prixTotalTTC} Ar TTC. Économisez jusqu'à ${data.tranche}% par rapport à ${data.consommationNormal} kWh (${data.prixTTC} Ar TTC). Consommation idéale : ${data.consommationJour} kWh/jour et ${data.consommationHeure} kWh/heure."
    
    Les réponses doivent se limiter aux informations ci-dessus.
    Veuillez préciser TTC dans la message
    Les réponses ne doivent pas dépasser 30 mots.
`;
