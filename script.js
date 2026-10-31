
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

  if (!form) {
    console.error('No se encontró el formulario RSVP.');
    return;
  }

  const success = document.getElementById('success');
  const submitButton = form.querySelector('button[type="submit"]');

  if (!success || !submitButton) {
    console.error('No se encontraron los elementos del formulario.');
    return;
  }

  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbxg20_W8xVs6Enu3QA2BPVnzTLOBbvwLlpey4qFDokKcvKoyjZRyO3J4wIBgyMBRRjh/exec';

  const responseFrame = document.createElement('iframe');

  responseFrame.name = 'rsvpResponseFrame';
  responseFrame.title = 'Respuesta del formulario RSVP';
  responseFrame.style.display = 'none';

  document.body.appendChild(responseFrame);

  form.action = SCRIPT_URL;
  form.method = 'POST';
  form.target = 'rsvpResponseFrame';

  let submitted = false;
  let currentRequestId = null;
  let responseTimer = null;

  success.style.display = 'none';

  // ------------------------------------------
  // Mostrar error
  // ------------------------------------------

  function showError(message) {
    submitted = false;
    currentRequestId = null;

    clearTimeout(responseTimer);

    submitButton.disabled = false;
    submitButton.textContent = 'Enviar confirmación';

    success.textContent = message;
    success.style.display = 'block';
  }

  // ------------------------------------------
  // Mostrar confirmación exitosa
  // ------------------------------------------

  function showSuccess() {
    submitted = false;
    currentRequestId = null;

    clearTimeout(responseTimer);

    submitButton.disabled = true;
    submitButton.textContent = '¡Confirmación enviada!';

    // Ocultar el mensaje de confirmación.
    success.textContent = '';
    success.style.display = 'none';

    form.reset();
  }

  // ------------------------------------------
  // Enviar formulario
  // ------------------------------------------

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

    // Identificador único para esta solicitud.
    currentRequestId = crypto.randomUUID();

    let requestInput = form.querySelector(
      'input[name="requestId"]'
    );

    if (!requestInput) {
      requestInput = document.createElement('input');
      requestInput.type = 'hidden';
      requestInput.name = 'requestId';
      form.appendChild(requestInput);
    }

    requestInput.value = currentRequestId;

    success.style.display = 'none';
    success.textContent = '';

    submitButton.disabled = true;
    submitButton.textContent = 'Enviando…';

    clearTimeout(responseTimer);

    responseTimer = setTimeout(function () {
      if (!submitted) return;

      showError(
        'No pudimos verificar tu confirmación. Antes de intentarlo nuevamente, revisa si tu respuesta ya aparece en nuestra lista.'
      );
    }, 30000);
  });

  // ------------------------------------------
  // Recibir respuesta de Google Apps Script
  // ------------------------------------------

  window.addEventListener('message', function (event) {
    const data = event.data;

    if (!data || data.type !== 'rsvp-result') {
      return;
    }

    if (!submitted || data.requestId !== currentRequestId) {
      return;
    }

    if (data.status === 'success') {
      showSuccess();
    } else {
      showError(
        'No se pudo guardar tu confirmación. Revisa los datos e inténtalo nuevamente.'
      );
    }
  });
});
