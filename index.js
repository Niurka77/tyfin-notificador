// index.js
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// Tu clave FCM (la misma de google-services.json)
const FCM_SERVER_KEY = 'AIzaSyBRn9-wSylEN6a95kvbrh3ZYgPnye1ZHm0';
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

// Endpoint para enviar notificaciones
app.post('/enviar', async (req, res) => {
  try {
    const { tokens_destino, titulo, cuerpo, datos = {} } = req.body;

    if (!Array.isArray(tokens_destino) || tokens_destino.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un token destino' });
    }

    const payload = {
      registration_ids: tokens_destino,
      notification: {
        title: titulo,
        body: cuerpo,
        sound: 'default'
      },
      data: {
        ...datos,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };

    const response = await fetch(FCM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Notificaciones enviadas: ${result.success}`);
      res.json({ success: true, result });
    } else {
      console.error('❌ Error FCM:', result);
      res.status(500).json({ error: 'Error al enviar notificación', details: result });
    }
  } catch (error) {
    console.error('🔥 Error en el servidor:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servicio de notificaciones listo en puerto ${PORT}`);
});