// index.js
const express = require('express');
const { GoogleAuth } = require('google-auth-library');

const app = express();
app.use(express.json());

const projectId = 'tyfin-notificaciones';
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

// ✅ Leer credenciales desde la variable de entorno (NO desde archivo)
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
const auth = new GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/firebase.messaging']
});

app.post('/enviar', async (req, res) => {
  try {
    const { tokens_destino, titulo, cuerpo, datos = {} } = req.body;

    if (!Array.isArray(tokens_destino) || tokens_destino.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un token destino' });
    }

    const accessToken = await auth.getAccessToken();

    const results = [];
    for (const token of tokens_destino) {
      const payload = {
        message: {
          token,
          notification: { title: titulo, body: cuerpo },
          data: {
            ...datos,
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          android: {
            notification: { sound: 'default' }
          },
          apns: {
            payload: {
              aps: { sound: 'default' }
            }
          }
        }
      };

      const response = await fetch(FCM_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      results.push({ token, success: response.ok, result });
    }

    console.log('✅ Notificaciones procesadas:', results.length);
    res.json({ success: true, results });

  } catch (error) {
    console.error('🔥 Error al enviar notificaciones:', error);
    res.status(500).json({ error: 'Error interno', message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servicio de notificaciones listo en puerto ${PORT}`);
});