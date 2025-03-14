import pandas as pd
from sklearn.ensemble import IsolationForest
import sys
import json

# Charger les données depuis la ligne de commande
data = json.loads(sys.argv[1])

# Convertir en DataFrame
df = pd.DataFrame(data)

# Vérifiez les colonnes du DataFrame
print("Colonnes du DataFrame :", df.columns)

# Vérifiez si la colonne 'consommation' existe
if 'consommation' not in df.columns:
    print("Erreur: La colonne 'consommation' n'existe pas dans les données.")
    sys.exit(1)

# Appliquer Isolation Forest
model = IsolationForest()
df["status"] = model.fit_predict(df[["consommation"]])

# Traduire les valeurs -1, 0, et 1 en status
df["status"] = df["status"].map({
    -1: -1,  # Basse valeur
     0:  0,  # Valeur normale
     1:  1   # Haute valeur
})

# Retourner les résultats
print(df[["date", "consommation", "status"]].to_json(orient="records"))



# import pandas as pd
# from sklearn.ensemble import IsolationForest
# import sys
# import json

# # Charger les données depuis la ligne de commande
# data = json.loads(sys.argv[1])

# # Convertir en DataFrame
# df = pd.DataFrame(data)

# # Vérifiez les colonnes du DataFrame
# print("Colonnes du DataFrame :", df.columns)

# # Vérifiez si la colonne 'consommation' existe
# if 'consommation' not in df.columns:
#     print("Erreur: La colonne 'consommation' n'existe pas dans les données.")
#     sys.exit(1)

# # Appliquer Isolation Forest
# model = IsolationForest()
# df["anomaly"] = model.fit_predict(df[["consommation"]])

# # Retourner les résultats
# print(df[["date", "consommation", "anomaly"]].to_json(orient="records"))
