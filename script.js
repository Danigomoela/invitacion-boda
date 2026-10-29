
document.addEventListener('DOMContentLoaded', function () {
  // ==========================================
  // 1. MÚSICA DE FONDO
  // ==========================================

  const music = document.getElementById('backgroundMusic');
  const musicButton = document.querySelector('.music-toggle');

  if (music && musicButton) {
    music.addEventListener('error', function () {
      console.error(
        'No se pudo cargar la música. Comprueba Resources/cancion.mp3.',
        music.currentSrc,
        music.error
      );

      musicButton.textContent = 'Error al cargar la música';
    });

    musicButton.addEventListener('click', async function () {
      if (music.paused) {
        try {
          await music.play();

          musicButton.textContent = 'Ⅱ Pausar música';
          musicButton.setAttribute(
            'aria-label',
            'Pausar música de fondo'
          );
        } catch (error) {
          console.error('Error al reproducir la música:', error);
          musicButton.textContent = 'No se pudo reproducir';
        }
      } else {
        music.pause();

        musicButton.textContent = '♫ Activar música';
        musicButton.setAttribute(
          'aria-label',
          'Activar música de fondo'
        );
      }
    });
  } else {
    console.error('No se encontró el audio o el botón de música.');
  }

  // ==========================================
  // 2. FECHA Y CUENTA REGRESIVA
  // ==========================================

  const date = document.querySelector('.hero .date');

  if (date) {
    date.textContent =
      'SÁBADO · 19 DE DICIEMBRE DE 2026 · 5:00 P. M.';

    // Evitar crear la cuenta regresiva dos veces.
    let countdown = document.querySelector('.countdown');

    if (!countdown) {
      countdown = document.createElement('div');
      countdown.className = 'countdown';
      countdown.setAttribute(
        'aria-label',
        'Cuenta regresiva para la boda'
      );

      countdown.innerHTML = `
        <div class="countdown-title">
          FALTA PARA NUESTRO GRAN DÍA
        </div>

        <div class="countdown-grid">
          <div>
            <span data-unit="days">0</span>
            <small>DÍAS</small>
          </div>

          <div>
            <span data-unit="hours">00</span>
            <small>HORAS</small>
          </div>

          <div>
            <span data-unit="minutes">00</span>
            <small>MINUTOS</small>
          </div>

          <div>
            <span data-unit="seconds">00</span>
            <small>SEGUNDOS</small>
          </div>
        </div>
      `;

      date.insertAdjacentElement('afterend', countdown);
    }

    // Mes 11 = diciembre. Usa la hora local del navegador.
    const target = new Date(2026, 11, 19, 17, 0, 0).getTime();

    function updateCountdown() {
      const remaining = Math.max(0, target - Date.now());

      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor(
        (remaining % 86400000) / 3600000
      );
      const minutes = Math.floor(
        (remaining % 3600000) / 60000
      );
      const seconds = Math.floor(
        (remaining % 60000) / 1000
      );

      countdown.querySelector('[data-unit="days"]').textContent =
        days;

      countdown.querySelector('[data-unit="hours"]').textContent =
        String(hours).padStart(2, '0');

      countdown.querySelector('[data-unit="minutes"]').textContent =
        String(minutes).padStart(2, '0');

      countdown.querySelector('[data-unit="seconds"]').textContent =
        String(seconds).padStart(2, '0');

      if (target <= Date.now()) {
        countdown.querySelector('.countdown-title').textContent =
          '¡HOY ES NUESTRO GRAN DÍA!';
      }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  } else {
    console.error('No se encontró la fecha de la boda.');
  }

  // ==========================================
  // 3. FORMULARIO RSVP Y GOOGLE SHEETS
  // ==========================================

  const form = document.getElementById('rsvpForm');
  const success = document.getElementById('success');

  if (!form || !success) {
    console.error('No se encontró el formulario RSVP.');
    return;
  }

  const submitButton = form.querySelector(
    'button[type="submit"]'
  );

  if (!submitButton) {
    console.error('No se encontró el botón de envío.');
    return;
  }

  const note = form.querySelector('.note');

  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbxg20_W8xVs6Enu3QA2BPVnzTLOBbvwLlpey4qFDokKcvKoyjZRyO3J4wIBgyMBRRjh/exec';

  form.action = SCRIPT_URL;
  form.method = 'POST';
  form.target = 'rsvpResponseFrame';

  // El mensaje de éxito ya no se muestra como recuadro.
  success.style.display = 'none';
  success.textContent = '';

  if (note) {
    note.textContent =
      'Tu respuesta se enviará para guardarse en la lista de confirmaciones.';
  }

  // Crear un iframe oculto para no salir de la invitación.
  const responseFrame = document.createElement('iframe');

  responseFrame.name = 'rsvpResponseFrame';
  responseFrame.title = 'Respuesta del formulario RSVP';
  responseFrame.style.display = 'none';
  responseFrame.setAttribute('aria-hidden', 'true');

  document.body.appendChild(responseFrame);

  let submitted = false;
  let responseTimer = null;
  let responseFrameLoaded = false;
  let fallbackTimer = null;

  function clearTimers() {
    if (responseTimer !== null) {
      clearTimeout(responseTimer);
      responseTimer = null;
    }

    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  function showError(message) {
    submitted = false;
    clearTimers();

    submitButton.disabled = false;
    submitButton.textContent = 'Enviar confirmación';

    success.textContent = message;
    success.style.display = 'block';
  }

  function showSent() {
    submitted = false;
    clearTimers();

    submitButton.disabled = true;
    submitButton.textContent = '¡Confirmación enviada!';

    // No mostrar el recuadro de confirmación.
    success.textContent = '';
    success.style.display = 'none';

    // Limpiar los campos solo después de confirmar el éxito.
    form.reset();
  }

  // Detectar la carga de la respuesta del iframe.
  responseFrame.addEventListener('load', function () {
    if (!responseFrameLoaded) {
      responseFrameLoaded = true;
      return;
    }

    if (!submitted) {
      return;
    }

    // Dar tiempo a Apps Script para enviar postMessage.
    fallbackTimer = setTimeout(function () {
      if (!submitted) {
        return;
      }

      // No afirmar que se guardó si no recibimos confirmación.
      showError(
        'No pudimos verificar el envío. Revisa la lista de respuestas antes de volver a intentarlo.'
      );
    }, 2000);
  });

  // Procesar el formulario.
  form.addEventListener('submit', function (event) {
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }

    if (submitted) {
      event.preventDefault();
      return;
    }

    submitted = true;
    clearTimers();

    success.textContent = '';
    success.style.display = 'none';

    submitButton.disabled = true;
    submitButton.textContent = 'Enviando…';

    // Tiempo máximo de espera por una respuesta de Apps Script.
    responseTimer = setTimeout(function () {
      if (!submitted) {
        return;
      }

      showError(
        'No pudimos verificar el envío. Revisa tu conexión y la lista de respuestas antes de intentarlo de nuevo.'
      );
    }, 15000);
  });

  // Recibir el resultado enviado por Google Apps Script.
  window.addEventListener('message', function (event) {
    if (event.source !== responseFrame.contentWindow) {
      return;
    }

    if (
      !event.data ||
      event.data.type !== 'rsvp-result'
    ) {
      return;
    }

    if (!submitted) {
      return;
    }

    if (event.data.status === 'success') {
      showSent();
    } else {
      showError(
        'No se pudo guardar tu confirmación. Revisa los datos e inténtalo de nuevo.'
      );
    }
  });
});
