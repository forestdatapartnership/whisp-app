# Politique de confidentialité de WHISP

*Cette traduction est fournie à titre informatif uniquement. En cas de divergence, la version anglaise prévaut.*

**Dernière mise à jour :** octobre 2026

## 1. À propos de cette politique

WHISP (« What is in that plot? », qu'y a-t-il dans cette parcelle ?) est développé et maintenu par le **Forest Data Partnership** sous l'égide de l'**Organisation des Nations Unies pour l'alimentation et l'agriculture (FAO)**, dans le cadre de l'initiative **OpenForis**. En tant que plateforme de la FAO, WHISP relève de l'[Avis relatif à la protection et à la confidentialité des données](https://www.fao.org/contact-us/data-protection-and-privacy/fr/) et de la [Politique de protection des données](https://www.fao.org/fileadmin/user_upload/legal/docs/AC2022-06.pdf) de la FAO, et non d'un cadre juridique national ou régional particulier. Cette politique y ajoute ce qui est propre à WHISP et explique clairement et honnêtement quelles données nous collectons, comment nous les utilisons et quel contrôle nous vous donnons sur vos informations. En cas de divergence entre les deux sur une question de protection des données, l'avis de la FAO prévaut. Aucune disposition de cette politique ne constitue une renonciation aux privilèges et immunités de la FAO.

- **Site web :** [https://whisp.openforis.org](https://whisp.openforis.org)
- **Contact :** [Open-Foris@fao.org](mailto:Open-Foris@fao.org)
- **Dépôt :** [https://github.com/forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)

## 2. Données que nous collectons

### 2.1 Données de compte

Les comptes WHISP sont créés via l'authentification unique (SSO) de la FAO. Lors de votre première connexion, le service d'authentification de la FAO confirme votre identité et transmet à WHISP votre nom, votre adresse e-mail et un identifiant de compte. WHISP ne reçoit jamais votre mot de passe SSO, et votre compte SSO est géré par la FAO. Les comptes créés avant le SSO, qui se connectent avec un mot de passe WHISP (« comptes propres à WHISP »), conservent également un mot de passe et, facultativement, une organisation.

| Donnée | Finalité |
|---|---|
| **Identifiant du compte SSO** | Associer votre compte WHISP à votre connexion FAO |
| **Prénom, nom** | Identification du compte |
| **Adresse e-mail** | Identification du compte, notifications, réinitialisation du mot de passe pour les comptes propres à WHISP |
| **Mot de passe** (comptes propres à WHISP) | Authentification (stocké sous forme de hachage bcrypt, jamais en clair) |
| **Organisation** (comptes propres à WHISP, facultatif) | Contexte du profil utilisateur |

### 2.2 Données techniques

Lorsque vous utilisez le service WHISP, nous collectons automatiquement :

| Donnée | Finalité | Conservation |
|---|---|---|
| **Adresse IP** | Sécurité, prévention des abus, limitation du débit | Anonymisée après la période de conservation configurable (par défaut : 90 jours) |
| **Agent utilisateur** | Débogage, compatibilité | Politique de rotation des journaux |
| **Clé d'API** | Contrôle d'accès à l'API et limitation du débit ; une clé est créée automatiquement lors de votre première connexion | Jusqu'à révocation ou suppression du compte |

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

### 2.5 Commentaires

| Donnée | Finalité |
|---|---|
| **Réponses au formulaire de commentaires** (évaluation, région, type d'organisation, réponses libres) | Améliorer WHISP |

Si vous êtes connecté, vos commentaires sont associés à votre compte. N'incluez pas de données personnelles dans vos commentaires.

## 3. Comment nous utilisons vos données

Nous utilisons vos données personnelles exclusivement pour :

- **Fournir le service** — gestion du compte, authentification, accès à l'API
- **Exécuter des analyses géospatiales** — traiter les géométries que vous soumettez via Google Earth Engine (aucune donnée personnelle n'est envoyée à GEE)
- **Communications du service** — réinitialisation du mot de passe pour les comptes propres à WHISP, notifications du service
- **Sécurité et prévention des abus** — limitation du débit, détection des abus par adresse IP
- **Amélioration du service** — statistiques d'utilisation agrégées et non identifiantes

Nous n'utilisons **pas** vos données pour :
- Le profilage ou la prise de décision automatisée
- La publicité ou le marketing auprès de tiers
- La vente ou la location à des tiers

## 4. Conservation des données

| Catégorie de données | Durée de conservation |
|---|---|
| **Données de compte** (nom, e-mail, identifiant SSO ; hachage du mot de passe pour les comptes propres à WHISP) | Jusqu'à la suppression de votre compte |
| **Adresses IP** dans les enregistrements de tâches d'analyse | Anonymisées automatiquement après la période de conservation configurée (par défaut : 90 jours) |
| **Métadonnées des tâches d'analyse** | Conservées pour le fonctionnement du service ; les adresses IP qu'elles contiennent sont anonymisées selon le calendrier ci-dessus |
| **Clés d'API** | Jusqu'à révocation ou suppression du compte (suppression logique pour la piste d'audit) |
| **Jetons de réinitialisation du mot de passe** (comptes propres à WHISP) | Valables 1 heure ; révoqués après utilisation |
| **Abonnements aux notifications** | Jusqu'à votre désabonnement ou la suppression de votre compte |
| **Commentaires** | Conservés pour améliorer le service ; dissociés de votre compte si vous le supprimez |
| **Journaux de l'application** | Soumis à la politique de rotation des journaux de l'infrastructure |

## 5. Services tiers et transferts de données

WHISP interagit avec les services tiers suivants pendant son fonctionnement :

| Service | Données partagées | Finalité |
|---|---|---|
| **Google Cloud** | Toutes les données stockées par WHISP (comptes, clés d'API, enregistrements de tâches d'analyse, commentaires, etc.) | Hébergement de l'application et de sa base de données |
| **Google Earth Engine** | Géométries et paramètres techniques d'analyse uniquement. **Aucune donnée personnelle** (noms, e-mails, adresses IP, identifiants utilisateur) n'est transmise. | Moteur de calcul géospatial |
| **Asset Registry** | GeoIDs (lors d'une soumission par GeoID) et, si vous vous connectez avec le SSO, un jeton d'accès SSO de courte durée | Résolution des identifiants géographiques en géométries |
| **SMTP Google Gmail** | Adresse e-mail du destinataire, contenu de l'e-mail | Envoi des e-mails de réinitialisation du mot de passe pour les comptes propres à WHISP |
| **API Google Maps** | Interactions cartographiques côté client (soumises à la politique de confidentialité de Google) | Visualisation cartographique dans l'interface |

WHISP fonctionne sur des serveurs Google Cloud situés en Europe. Pour les preuves techniques de la séparation des données entre WHISP et Google Earth Engine, voir l'[annexe sur la séparation des données GEE](./gee-data-separation).

## 6. Cookies et stockage local

WHISP utilise les cookies suivants :

| Cookie | Type | Finalité | Durée |
|---|---|---|---|
| `token` | Strictement nécessaire | Session WHISP (JWT) | 30 minutes |
| `refreshToken` | Strictement nécessaire | Renouvellement de la session WHISP | 7 jours |
| `kc_refresh_token` | Strictement nécessaire | Maintien de votre session SSO pour les recherches de GeoID et la déconnexion du SSO | 30 jours |
| `sso_state` | Strictement nécessaire | Protection de la redirection de connexion SSO | 5 minutes |

Ces cookies sont :
- **HttpOnly** — inaccessibles au JavaScript côté client
- **Secure** — transmis uniquement via HTTPS (en production)
- **SameSite=Strict** — non envoyés avec les requêtes intersites, sauf `sso_state`, qui utilise SameSite=Lax afin d'être encore envoyé lorsque la page de connexion de la FAO vous redirige

WHISP conserve également les éléments suivants dans votre navigateur. Ils ne sont pas envoyés aux serveurs de WHISP :

| Élément | Stockage | Finalité |
|---|---|---|
| `whisp-theme` | Stockage local | Votre choix de thème clair ou sombre |
| `whisp-intro-dismissed` | Stockage local | Mémoriser que vous avez fermé l'introduction |
| `whisp-feedback-prompt-dismissed` | Stockage local | Mémoriser que vous avez répondu à l'invitation à donner votre avis ou l'avez fermée |
| `whisp-sync:…` | Stockage de session | Transmettre les résultats d'analyse à la page des résultats ; supprimés une fois lus |
| `whisp-release-v…` | Stockage de session | Mettre en cache le lien vers les notes de la version actuelle |
| Base de données `whisp` | IndexedDB | Afficher un fichier de résultats ouvert depuis votre ordinateur ; supprimé lorsque vous revenez à la page de soumission |

WHISP n'utilise aucun cookie d'analyse, de suivi ou de publicité.

## 7. Vos données, votre contrôle

Nous estimons que vous devez disposer d'un contrôle réel sur vos données personnelles. Voici ce que WHISP propose :

### 7.1 Accéder à vos données

Vous pouvez consulter vos données personnelles à tout moment sur la page **Compte** de WHISP. Pour recevoir une copie des données personnelles que nous détenons à votre sujet, présentez une demande formelle (voir 7.6).

### 7.2 Corriger vos données

Si vous vous connectez avec le SSO, votre nom et votre adresse e-mail proviennent de votre compte FAO ; modifiez-les à cet endroit via **Gérer le compte** sur la page **Compte**. Pour les comptes propres à WHISP, vous pouvez mettre à jour votre prénom, votre nom et votre organisation sur la page **Compte** ; pour modifier votre adresse e-mail, veuillez nous contacter.

### 7.3 Supprimer votre compte

Vous pouvez supprimer définitivement votre compte et toutes les données associées depuis la page **Compte**. La suppression du compte :
- Requiert une confirmation, ainsi que le mot de passe pour les comptes propres à WHISP
- Supprime définitivement votre profil utilisateur, vos clés d'API, vos jetons de vérification, vos jetons de réinitialisation du mot de passe et vos abonnements aux notifications
- Anonymise les enregistrements de tâches d'analyse et les commentaires associés

La suppression de votre compte WHISP ne supprime pas votre compte SSO, qui est géré par la FAO.

### 7.4 Limiter le traitement des données

Vous pouvez réduire les données que nous traitons activement en révoquant votre clé d'API, en vous désabonnant des notifications ou en supprimant entièrement votre compte. Vous pouvez également vous opposer au traitement de vos données par une demande formelle (voir 7.6).

### 7.5 Refuser les notifications

Vous pouvez vous désabonner des notifications du service à tout moment sur la page **Compte** ou en nous contactant.

### 7.6 Demandes formelles et préoccupations

Si vous avez des préoccupations concernant le traitement de vos données, nous vous encourageons à nous contacter directement. Nous prenons au sérieux toutes les préoccupations liées à la protection des données et y répondrons rapidement.

Vous pouvez également présenter une demande formelle d'accès à vos données personnelles (y compris une copie), de rectification ou de suppression, ou vous opposer à leur traitement, auprès de l'Unité de protection des données de la FAO : soumettez-la sur le [portail ServiceNow de la FAO](https://fao.service-now.com/csp) en sélectionnant **Data Privacy**. La FAO peut avoir besoin de vérifier d'abord votre identité et vous expliquera si une partie de la demande ne peut pas être satisfaite.

## 8. Sécurité des données

Nous mettons en œuvre les mesures techniques suivantes pour protéger vos données :

- **Authentification unique de la FAO**, de sorte que WHISP ne manipule jamais votre mot de passe SSO
- **Hachage des mots de passe** avec bcrypt (hachage unidirectionnel salé) pour les comptes propres à WHISP
- **Jetons JWT** stockés dans des cookies sécurisés HttpOnly avec SameSite=Strict
- **Restrictions CORS** limitées aux origines autorisées configurées
- **Limitation du débit** sur les points de terminaison de l'API et l'envoi de commentaires
- **Politique de mots de passe robustes** pour les comptes propres à WHISP (au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial)
- **Anonymisation automatique des données personnelles** des adresses IP après la période de conservation configurée
- **Séparation par conception** entre les données de compte utilisateur et le traitement des analyses géospatiales

Si un incident de sécurité expose vos données personnelles à un risque important, la FAO applique ses procédures de réponse aux incidents, qui peuvent inclure l'information des utilisateurs concernés.

## 9. Mineurs

WHISP ne s'adresse pas aux mineurs, et nous ne collectons pas sciemment de données personnelles concernant des enfants.

## 10. Modifications de cette politique

Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Les modifications seront reflétées dans la date de « Dernière mise à jour » en haut de ce document. Les changements importants seront communiqués via le service.

## 11. Contact

Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez :

[Open-Foris@fao.org](mailto:Open-Foris@fao.org)

Pour les demandes formelles en matière de protection des données, utilisez le portail ServiceNow de la FAO comme décrit à la section 7.6.
