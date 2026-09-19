# Politique de confidentialité de WHISP

*Cette traduction est fournie à titre informatif uniquement. En cas de divergence, la version anglaise prévaut.*

**Dernière mise à jour :** mars 2026

## 1. À propos de cette politique

WHISP (« What is in that plot? », qu'y a-t-il dans cette parcelle ?) est développé et maintenu par le **Forest Data Partnership** sous l'égide de l'**Organisation des Nations Unies pour l'alimentation et l'agriculture (FAO)**, dans le cadre de l'initiative **OpenForis**. En tant que programme des Nations Unies, WHISP relève des principes internes de protection des données de la FAO et non d'un cadre juridique national ou régional particulier. Cette politique explique clairement et honnêtement quelles données nous collectons, comment nous les utilisons et quel contrôle nous vous donnons sur vos informations.

- **Site web :** [https://whisp.openforis.org](https://whisp.openforis.org)
- **Contact :** [Open-Foris@fao.org](mailto:Open-Foris@fao.org)
- **Dépôt :** [https://github.com/forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)

## 2. Données que nous collectons

### 2.1 Données de compte

Lorsque vous créez un compte WHISP, nous collectons :

| Donnée | Finalité |
|---|---|
| **Prénom, nom** | Identification du compte |
| **Adresse e-mail** | Authentification, vérification du compte, réinitialisation du mot de passe, notifications |
| **Mot de passe** | Authentification (stocké sous forme de hachage bcrypt, jamais en clair) |
| **Organisation** (facultatif) | Contexte du profil utilisateur |

### 2.2 Données techniques

Lorsque vous utilisez le service WHISP, nous collectons automatiquement :

| Donnée | Finalité | Conservation |
|---|---|---|
| **Adresse IP** | Sécurité, prévention des abus, limitation du débit | Anonymisée après la période de conservation configurable (par défaut : 90 jours) |
| **Agent utilisateur** | Débogage, compatibilité | Politique de rotation des journaux |
| **Clé d'API** | Contrôle d'accès à l'API et limitation du débit | Jusqu'à révocation ou suppression du compte |

### 2.3 Données d'analyse

Lorsque vous soumettez des géométries pour une analyse géospatiale :

| Donnée | Finalité |
|---|---|
| **Géométries** (GeoJSON, WKT ou GeoIDs) | Analyse de risque géospatiale via Google Earth Engine |
| **Options d'analyse** (paramètres techniques) | Configuration de l'exécution de l'analyse |
| **Métadonnées de la tâche d'analyse** (horodatages, état, type d'agent, point de terminaison) | Fonctionnement du service, audit, débogage |

Les géométries peuvent être sensibles selon le contexte (par exemple, la limite d'une exploitation liée à une personne). Le moteur d'analyse de WHISP traite les géométries **sans aucun contexte permettant d'identifier l'utilisateur** — voir l'[annexe sur la séparation des données GEE](./gee-data-separation) pour les preuves techniques.

### 2.4 Données de notification

| Donnée | Finalité |
|---|---|
| **Adresse e-mail** | Notifications du service |
| **Statut d'abonnement** | Gestion des préférences de notification |

## 3. Comment nous utilisons vos données

Nous utilisons vos données personnelles exclusivement pour :

- **Fournir le service** — gestion du compte, authentification, accès à l'API
- **Exécuter des analyses géospatiales** — traiter les géométries que vous soumettez via Google Earth Engine (aucune donnée personnelle n'est envoyée à GEE)
- **Communications du service** — vérification de l'e-mail, réinitialisation du mot de passe, notifications du service
- **Sécurité et prévention des abus** — limitation du débit, détection des abus par adresse IP
- **Amélioration du service** — statistiques d'utilisation agrégées et non identifiantes

Nous n'utilisons **pas** vos données pour :
- Le profilage ou la prise de décision automatisée
- La publicité ou le marketing auprès de tiers
- La vente ou la location à des tiers

## 4. Conservation des données

| Catégorie de données | Durée de conservation |
|---|---|
| **Données de compte** (nom, e-mail, hachage du mot de passe) | Jusqu'à la suppression de votre compte |
| **Adresses IP** dans les enregistrements de tâches d'analyse | Anonymisées automatiquement après la période de conservation configurée (par défaut : 90 jours) |
| **Métadonnées des tâches d'analyse** | Conservées pour le fonctionnement du service ; les adresses IP qu'elles contiennent sont anonymisées selon le calendrier ci-dessus |
| **Clés d'API** | Jusqu'à révocation ou suppression du compte (suppression logique pour la piste d'audit) |
| **Jetons de vérification d'e-mail / de réinitialisation du mot de passe** | Valables 1 heure ; révoqués après utilisation |
| **Abonnements aux notifications** | Jusqu'à votre désabonnement ou la suppression de votre compte |
| **Journaux de l'application** | Soumis à la politique de rotation des journaux de l'infrastructure |

## 5. Services tiers et transferts de données

WHISP interagit avec les services tiers suivants pendant son fonctionnement :

| Service | Données partagées | Finalité |
|---|---|---|
| **Google Earth Engine** | Géométries et paramètres techniques d'analyse uniquement. **Aucune donnée personnelle** (noms, e-mails, adresses IP, identifiants utilisateur) n'est transmise. | Moteur de calcul géospatial |
| **Asset Registry** | GeoIDs (lors d'une soumission par GeoID) | Résolution des identifiants géographiques en géométries |
| **SMTP Google Gmail** | Adresse e-mail du destinataire, contenu de l'e-mail | Envoi des e-mails de vérification et de réinitialisation du mot de passe |
| **API Google Maps** | Interactions cartographiques côté client (soumises à la politique de confidentialité de Google) | Visualisation cartographique dans l'interface |

Pour les preuves techniques de la séparation des données entre WHISP et Google Earth Engine, voir l'[annexe sur la séparation des données GEE](./gee-data-separation).

## 6. Cookies et stockage local

WHISP utilise les cookies suivants :

| Cookie | Type | Finalité | Durée |
|---|---|---|---|
| `access_token` | Strictement nécessaire | Jeton d'authentification JWT | 30 minutes |
| `refresh_token` | Strictement nécessaire | Renouvellement du jeton JWT | 7 jours |

Ces cookies sont :
- **HttpOnly** — inaccessibles au JavaScript côté client
- **Secure** — transmis uniquement via HTTPS (en production)
- **SameSite=Strict** — non envoyés avec les requêtes intersites

WHISP n'utilise aucun cookie d'analyse, de suivi ou de publicité.

## 7. Vos données, votre contrôle

Nous estimons que vous devez disposer d'un contrôle réel sur vos données personnelles. Voici ce que WHISP propose :

### 7.1 Accéder à vos données

Vous pouvez consulter vos données personnelles à tout moment sur la page **Paramètres** de votre compte WHISP.

### 7.2 Corriger vos données

Vous pouvez mettre à jour votre prénom, votre nom et votre organisation sur la page **Paramètres**. Pour modifier votre adresse e-mail, veuillez nous contacter.

### 7.3 Supprimer votre compte

Vous pouvez supprimer définitivement votre compte et toutes les données associées depuis la page **Paramètres**. La suppression du compte :
- Requiert la confirmation du mot de passe
- Supprime définitivement votre profil utilisateur, vos clés d'API, vos jetons de vérification et vos jetons de réinitialisation du mot de passe
- Anonymise les enregistrements de tâches d'analyse associés

### 7.4 Limiter le traitement des données

Vous pouvez réduire les données que nous traitons activement en révoquant votre clé d'API, en vous désabonnant des notifications ou en supprimant entièrement votre compte.

### 7.5 Refuser les notifications

Vous pouvez vous désabonner des notifications du service à tout moment sur la page **Paramètres** ou en nous contactant.

### 7.6 Signaler une préoccupation

Si vous avez des préoccupations concernant le traitement de vos données, nous vous encourageons à nous contacter directement. Nous prenons au sérieux toutes les préoccupations liées à la protection des données et y répondrons rapidement.

## 8. Sécurité des données

Nous mettons en œuvre les mesures techniques suivantes pour protéger vos données :

- **Hachage des mots de passe** avec bcrypt (hachage unidirectionnel salé)
- **Jetons JWT** stockés dans des cookies sécurisés HttpOnly avec SameSite=Strict
- **Restrictions CORS** limitées aux origines autorisées configurées
- **Limitation du débit** sur l'inscription et les points de terminaison de l'API
- **Politique de mots de passe robustes** (au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial)
- **Anonymisation automatique des données personnelles** des adresses IP après la période de conservation configurée
- **Séparation par conception** entre les données de compte utilisateur et le traitement des analyses géospatiales

## 9. Modifications de cette politique

Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Les modifications seront reflétées dans la date de « Dernière mise à jour » en haut de ce document. Les changements importants seront communiqués via le service.

## 10. Contact

Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez :

[Open-Foris@fao.org](mailto:Open-Foris@fao.org)
