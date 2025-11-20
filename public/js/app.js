// ========================== UTILIDADES BÁSICAS ==========================
const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

// ========================== LOADER (OVERLAY + SPINNER) ==========================
function injectLoaderStyles() {
  const css = `
  #loaderOverlay{position:fixed;inset:0;background:rgba(5,8,20,.65);display:none;align-items:center;justify-content:center;z-index:9999}
  #loaderCard{background:#0f1733;border:1px solid #27326a;border-radius:14px;padding:18px 22px;min-width:260px;display:flex;gap:14px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.3)}
  .spinner{width:26px;height:26px;border-radius:50%;border:3px solid #3b59ff;border-top-color:transparent;animation:spin .9s linear infinite}
  #loaderText{color:#e7ecff;font:14px/1.4 system-ui,Segoe UI,Roboto,Arial}
  @keyframes spin{to{transform:rotate(360deg)}}
  .btn-disabled{opacity:.6;pointer-events:none}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}
function createLoader() {
  injectLoaderStyles();
  const overlay = document.createElement("div");
  overlay.id = "loaderOverlay";
  overlay.innerHTML = `
    <div id="loaderCard">
      <div class="spinner"></div>
      <div id="loaderText">Procesando…</div>
    </div>`;
  document.body.appendChild(overlay);
}
function showLoader(text = "Analizando respuesta…") {
  const el = $("loaderOverlay"); if (!el) return;
  $("loaderText").textContent = text;
  el.style.display = "flex";
  toggleButtons(true);
}
function hideLoader() {
  const el = $("loaderOverlay"); 
  if (!el) return;

  el.style.display = "none";
  toggleButtons(false);

  // 🔓 Nunca más lo bloqueamos aquí
  const btnEnviar = $("btnEnviar");
  if (btnEnviar) {
    btnEnviar.dataset.locked = "0";
  }

  // 🔥 FIX DEFINITIVO PARA iPhone/Android (input fantasma)
  setTimeout(() => {
    const b = $("btnEnviar");
    const ta = $("respuesta");
    if (!b || !ta) return;

    if (ta.value.trim() === "" || ta.disabled) {
      b.disabled = true;
      b.classList.add("btn-disabled");
    }
  }, 80);
}

function toggleButtons(disabled) {
  // No toques elementos marcados como "locked"
  const ids = ["btnIniciar","btnSiguiente","btnOtra","btnCopiar","btnDescargarPNG","btnModo","btnMenu"];
  ids.forEach(id=>{
    const b=$(id); if(!b) return;
    if (b.dataset.locked === "1") return;
    if(disabled){ b.classList.add("btn-disabled"); b.setAttribute("disabled","disabled"); }
    else{ b.classList.remove("btn-disabled"); b.removeAttribute("disabled"); }
  });
}

// ========================== PARSEO ROBUSTO RESPUESTA LLM ==========================
function stripCodeFences(s) {
  if (!s) return "";
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  return s.trim();
}
function extractFirstJson(s) {
  s = s.trim();
  if (s.startsWith("{") && s.endsWith("}")) return JSON.parse(s);
  let depth = 0, start = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") { if (depth === 0) start = i; depth++; }
    else if (ch === "}") { depth--; if (depth === 0 && start !== -1) {
      const chunk = s.slice(start, i + 1);
      try { return JSON.parse(chunk); } catch {}
    }}
  }
  throw new Error("NoJSON");
}
function safeParseJsonResponse(text) {
  if (!text) throw new Error("Empty");
  const clean = stripCodeFences(text);
  return extractFirstJson(clean);
}

// ========================== DATOS: 10 PUESTOS x 10 PREGUNTAS ==========================
const PUESTOS = {
  desarrollador_junior: {
    nombre: "Desarrollador/a Junior (TI)",
    preguntas: [
      "Cuéntame un proyecto escolar o personal de programación y tu rol.",
      "¿Cómo te organizas al trabajar con Git y ramas simples?",
      "Describe una ocasión en la que depuraste un error difícil.",
      "¿Cómo validas la calidad de tu código (pruebas básicas, formato)?",
      "Ejemplo de aprendizaje rápido de una tecnología nueva.",
      "¿Cómo priorizas tareas cuando hay varios pendientes?",
      "Cuenta un momento en que pediste ayuda o colaboraste bien.",
      "Relata cómo te adaptaste a cambios de requisitos.",
      "¿Cómo documentas lo que haces para el equipo?",
      "Describe una situación donde actuaste con ética (p. ej., datos)."
    ]
  },
  soporte_tecnico: {
    nombre: "Soporte Técnico Junior",
    preguntas: [
      "Cuéntame cómo resolviste un problema de hardware o software para alguien.",
      "¿Cómo haces preguntas para entender el problema del usuario?",
      "Describe una ocasión en la que priorizaste varios tickets.",
      "¿Cómo documentas soluciones para reutilizarlas?",
      "Ejemplo de aprendizaje de una herramienta nueva de soporte.",
      "¿Cómo manejas la presión y mantienes la calidad?",
      "Relata una experiencia colaborando con otro equipo.",
      "¿Cómo garantizas trato respetuoso y ético con usuarios?",
      "Describe una solución creativa que aplicaste.",
      "¿Cómo verificas el resultado con el usuario?"
    ]
  },
  marketing_digital: {
    nombre: "Marketing Digital Junior",
    preguntas: [
      "Describe una campaña que te inspiró y por qué.",
      "Cuéntame cómo definirías un objetivo SMART sencillo.",
      "¿Cómo analizarías resultados básicos (CTR, alcance)?",
      "Ejemplo de colaboración con diseño o contenido.",
      "¿Cómo aprenderías una herramienta nueva (p. ej., Ads)?",
      "Relata una vez que cambiaste estrategia por datos.",
      "¿Cómo manejas comentarios negativos en redes?",
      "Ejemplo de proactividad proponiendo una idea.",
      "¿Cómo te aseguras de cumplir lineamientos y ética?",
      "Describe un A/B test simple que harías."
    ]
  },
  ventas_jr: {
    nombre: "Ejecutivo/a de Ventas Junior",
    preguntas: [
      "Cuéntame de una ocasión en que convenciste a alguien con argumentos.",
      "¿Cómo priorizas clientes y haces seguimiento?",
      "Describe cómo manejaste una objeción.",
      "Ejemplo de meta alcanzada y cómo lo lograste.",
      "¿Cómo colaboras con postventa o soporte?",
      "Relata una vez que aprendiste del rechazo.",
      "¿Cómo cuidas la ética al vender?",
      "Ejemplo de propuesta de mejora en el proceso.",
      "¿Cómo usas preguntas para entender necesidades?",
      "Describe una situación con resultados medibles."
    ]
  },
  atencion_clientes: {
    nombre: "Atención a Clientes",
    preguntas: [
      "Relata una ocasión donde mantuviste la calma con un cliente.",
      "¿Cómo identificas el problema real detrás de la queja?",
      "Ejemplo de escalamiento correcto de un caso.",
      "¿Cómo mides la satisfacción (CSAT) de forma simple?",
      "Cuenta cómo aprendiste un procedimiento nuevo rápido.",
      "¿Cómo gestionas múltiples casos a la vez?",
      "Ejemplo de colaboración con otro equipo para resolver.",
      "¿Cómo proteges datos del cliente (ética)?",
      "Describe una idea para mejorar tiempos de respuesta.",
      "¿Cómo confirmas que el problema quedó resuelto?"
    ]
  },
  analista_datos_jr: {
    nombre: "Analista de Datos Junior",
    preguntas: [
      "Cuéntame un análisis básico que hiciste (p. ej., Excel).",
      "¿Cómo limpias datos sencillos antes de analizar?",
      "Ejemplo de una métrica clave que elegiste y por qué.",
      "¿Cómo validarías resultados para evitar errores?",
      "Relata un aprendizaje reciente (p. ej., tablas dinámicas).",
      "¿Cómo comunicas hallazgos a no técnicos?",
      "Ejemplo de colaboración con negocio.",
      "¿Cómo manejas datos sensibles (ética)?",
      "Describe un problema y tu hipótesis para resolverlo.",
      "¿Cómo priorizas análisis con poco tiempo?"
    ]
  },
  diseño_grafico: {
    nombre: "Diseño Gráfico Junior",
    preguntas: [
      "Cuéntame un proyecto visual y tu proceso creativo.",
      "¿Cómo recibes y aplicas feedback?",
      "Ejemplo de entrega a tiempo con calidad.",
      "¿Cómo colaboras con marketing o producto?",
      "Relata una vez que aprendiste una técnica nueva.",
      "¿Cómo resuelves bloqueos creativos?",
      "Ejemplo de proactividad con propuestas.",
      "¿Cómo cuidas derechos de autor y ética?",
      "Describe cómo presentas tus diseños a un cliente.",
      "¿Cómo mides si tu diseño funcionó?"
    ]
  },
  recursos_humanos_jr: {
    nombre: "Recursos Humanos Junior",
    preguntas: [
      "Relata una experiencia organizando o apoyando un proceso.",
      "¿Cómo garantizas confidencialidad y ética?",
      "Ejemplo de comunicación con diferentes áreas.",
      "¿Cómo aprendes políticas y las aplicas?",
      "Describe una mejora que propusiste en selección.",
      "¿Cómo priorizas vacantes o tareas administrativas?",
      "Ejemplo de resolución de un problema con empatía.",
      "¿Cómo mides resultados (tiempo de cobertura, etc.)?",
      "Cuenta una vez que pediste ayuda oportunamente.",
      "¿Cómo documentas procesos para el equipo?"
    ]
  },
  operaciones_logistica_jr: {
    nombre: "Operaciones / Logística Junior",
    preguntas: [
      "Cuéntame de una vez que coordinaste entregas o recursos.",
      "¿Cómo priorizas tareas para cumplir tiempos?",
      "Ejemplo de mejora para reducir errores.",
      "¿Cómo te adaptas a cambios de última hora?",
      "Relata un aprendizaje de una herramienta (p. ej., hojas).",
      "¿Cómo colaboras con proveedores o equipo?",
      "Ejemplo de resolución de problema imprevisto.",
      "¿Cómo cuidas seguridad y ética en operaciones?",
      "Describe cómo verificas la calidad de un proceso.",
      "¿Cómo comunicas avances y riesgos?"
    ]
  },
  administracion_jr: {
    nombre: "Administración Jr.",
    preguntas: [
      "Ejemplo de organización de documentos/procesos.",
      "¿Cómo priorizas tareas diarias?",
      "¿Cómo aseguras calidad en capturas y reportes?",
      "¿Qué haces ante instrucciones ambiguas?",
      "¿Cómo actuarías si detectas un error contable?",
      "Relata una mejora operativa que propusiste.",
      "¿Cómo coordinas con otras áreas?",
      "¿Cómo manejas información sensible?",
      "Ejemplo de aprendizaje al usar un sistema nuevo.",
      "¿Cómo manejas plazos y urgencias?"
    ]
  },
  finanzas_jr: {
    nombre: "Auxiliar de Finanzas Jr.",
    preguntas: [
      "Ejemplo de conciliación o control básico que realizaste.",
      "¿Cómo revisas facturas y comprobantes?",
      "¿Qué harías si hay una discrepancia?",
      "¿Qué indicadores te parecen clave (cash flow, etc.)?",
      "¿Cómo documentas procedimientos?",
      "Relata un aprendizaje con Excel/ERP.",
      "¿Cómo manejas información confidencial?",
      "¿Cómo priorizas cierres y entregas?",
      "¿Cómo te comunicarías con proveedores?",
      "Da un ejemplo de mejora de precisión."
    ]
  }
};

const COMPETENCIAS = [
  "AA",
  "ORC",
  "CC",
  "PCRP",
  "AP",
  "EIP",
];

const MAPA_SIGLAS = {
  "AA": "Aprendizaje y Adaptabilidad",
  "ORC": "Orientación a Resultados y Calidad",
  "CC": "Comunicación y Colaboración",
  "PCRP": "Pensamiento Crítico y Resolución de Problemas",
  "AP": "Autonomía y Proactividad",
  "EIP": "Ética e Integridad Profesional"
};

// ========================== ESTADO ==========================
let estado = {
  puestoKey: null,
  preguntas: [],
  indice: 0,
  respuestas: [], // {pregunta, respuesta, feedback}
  scores: [],     // array<number[6]> por pregunta
  chart: null,
  timerId: null,
};

// ========================== QR ==========================
function tryRenderQR() {
  try {
    if (!window.QRCode) throw new Error("QRCode no cargado");
    $("qr").innerHTML = "";
    new QRCode("qr", { text: location.href, width: 80, height: 80 });
  } catch (e) {
    console.warn("QR no generado:", e.message);
  }
}

// ========================== TIMER / VALIDACIONES ==========================
function mmss(s) {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}
function updateEnviarDisabled() {
  const ta = $("respuesta");
  const btn = $("btnEnviar");
  if (!ta || !btn) return;
  const vacio = !ta.value.trim();
  const disabled = vacio || ta.disabled === true;
  btn.disabled = disabled;
  btn.classList.toggle("btn-disabled", disabled);
}
function startTimer(segundos = 120) {
  clearInterval(estado.timerId);
  let restante = segundos;
  $("timer").textContent = mmss(restante);
  estado.timerId = setInterval(() => {
    restante--;
    $("timer").textContent = mmss(Math.max(restante, 0));
    if (restante <= 0) {
      clearInterval(estado.timerId);
      onTimeUp();
    }
  }, 1000);
}
function onTimeUp() {
  const ta = $("respuesta");
  ta.disabled = true;
  ta.placeholder = "⏱️ Tiempo agotado.";
  killMic();

  const btnVoz = $("btnVoz");
  if (btnVoz) {
    btnVoz.disabled = true;
    btnVoz.classList.add("btn-disabled");
    btnVoz.classList.remove("escuchando");
    btnVoz.dataset.locked = "1";
    btnVoz.textContent = "Dictar";
  }

  const tieneTexto = ta.value.trim().length > 0;

  if (!tieneTexto) {
    // Si NO escribió nada → enviar respuesta vacía
    enviarRespuesta(true);
  } else {
    // Si SÍ escribió algo → enviar automáticamente esa respuesta
    enviarRespuesta(false);
  }
}

// ===== DETECCIÓN DE SOPORTE PARA SPEECH RECOGNITION =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const dictadoSoportado = !!SpeechRecognition;

// Referencia del botón
const btnVoz = document.getElementById("btnVoz");

// Si NO está soportado
if (!dictadoSoportado) {
  if (btnVoz) {
    btnVoz.disabled = true;
    btnVoz.style.opacity = "0.5";
    btnVoz.style.cursor = "not-allowed";
    btnVoz.textContent = "🎤 Dictado no disponible";
    btnVoz.title = "El dictado solo funciona en Android usando HTTPS. iPhone no lo soporta.";
  }
}

// ========================== VOZ (Dictado) ==========================
let rec = null, escuchando = false;
function killMic() {
  try { if (rec) rec.stop(); } catch {}
  escuchando = false;
  const b = $("btnVoz");
  if (b) { b.textContent = "Dictar"; b.classList.remove("escuchando"); }
}
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  rec = new SR();
  rec.lang = "es-MX";
  rec.continuous = false;
  rec.interimResults = false;

  rec.onresult = (e) => {
    let texto = "";
    for (const r of e.results) texto += r[0].transcript + " ";
    $("respuesta").value = ($("respuesta").value + " " + texto).trim();
    updateEnviarDisabled();
  };
  rec.onstart = () => {
    escuchando = true;
    const b = $("btnVoz");
    b.textContent = "Escuchando...";
    b.classList.add("escuchando");
  };
  rec.onend = () => {
    escuchando = false;
    const b = $("btnVoz");
    b.textContent = "Dictar";
    b.classList.remove("escuchando");
  };
  rec.onerror = () => {
    escuchando = false;
    const b = $("btnVoz");
    b.textContent = "Dictar";
    b.classList.remove("escuchando");
  };
}
$("btnVoz") && ($("btnVoz").onclick = () => {
  if (!rec) return alert("Tu navegador no soporta dictado por voz (usa Chrome o Edge).");
  const ta = $("respuesta");
  if (ta.disabled) return;
  if (!escuchando) rec.start();
  else rec.stop();
});

// ========================== INIT ==========================
document.addEventListener("DOMContentLoaded", () => {
  createLoader();

  const sel = $("puesto");
  if (sel) {
    sel.innerHTML = "";
    Object.entries(PUESTOS).forEach(([key, v]) => {
      const opt = document.createElement("option");
      opt.value = key; opt.textContent = v.nombre;
      sel.appendChild(opt);
    });
  }

  tryRenderQR();

  $("btnIniciar") && ($("btnIniciar").onclick = onIniciar);
  $("btnEnviar") && ($("btnEnviar").onclick = () => enviarRespuesta(false));
  $("btnSiguiente") && ($("btnSiguiente").onclick = onSiguiente);
  $("btnOtra") && ($("btnOtra").onclick = () => {
    killMic();
    clearInterval(estado.timerId);
    hide("pantalla-resultados");
    show("pantalla-inicio");
  });

  const ta = $("respuesta");
  if (ta) {
    ta.placeholder = "Ingresa tu respuesta antes de que se agote el tiempo.";
    ta.addEventListener("input", updateEnviarDisabled);
  }
  updateEnviarDisabled();

  // Modo claro/oscuro
  const btnModo = $("btnModo");
  const temaGuardado = localStorage.getItem("tema");
  if (temaGuardado === "light") {
    document.body.classList.add("light");
    btnModo && (btnModo.textContent = "☀️");
  }
btnModo && btnModo.addEventListener("click", () => {
  const esClaro = document.body.classList.toggle("light");
  btnModo.textContent = esClaro ? "☀️" : "🌙";
  localStorage.setItem("tema", esClaro ? "light" : "dark");

  // ⭐ Si el gráfico ya existe, actualizar colores
  if (estado.chart) {
    renderRadar(estado.chart.data.datasets[0].data);
  }
});



  // Menú (confirmación)
  const btnMenu = $("btnMenu");
  const overlay = $("confirmOverlay");
  const btnConfirmarSalir = $("btnConfirmarSalir");
  const btnCancelarSalir = $("btnCancelarSalir");
  btnMenu && btnMenu.addEventListener("click", () => overlay && overlay.classList.add("show"));
  btnCancelarSalir && btnCancelarSalir.addEventListener("click", () => overlay && overlay.classList.remove("show"));
  btnConfirmarSalir && btnConfirmarSalir.addEventListener("click", () => {
    killMic(); clearInterval(estado.timerId);
    overlay.classList.remove("show");
    $("pantalla-pregunta").classList.add("hidden");
    $("pantalla-resultados").classList.add("hidden");
    $("pantalla-inicio").classList.remove("hidden");
    resetCamposPregunta();
    const btnMenu2 = $("btnMenu"); btnMenu2 && btnMenu2.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Historial de entrevistas
$("btnHistorial")?.addEventListener("click", mostrarHistorial);

$("btnVolverInicioHistorial")?.addEventListener("click", () => {
  hide("pantalla-historial");
  show("pantalla-inicio");
  window.scrollTo(0,0);
});

// === MODAL PARA BORRAR HISTORIAL ===
$("btnBorrarHistorial")?.addEventListener("click", () => {
  $("confirmOverlayHistorial").classList.add("show");
});

$("btnCancelarBorrarHist")?.addEventListener("click", () => {
  $("confirmOverlayHistorial").classList.remove("show");
});

$("btnConfirmarBorrarHist")?.addEventListener("click", () => {
  localStorage.removeItem("historialEntrevistas");
  $("confirmOverlayHistorial").classList.remove("show");
  $("listaHistorial").innerHTML = "<p class='muted'>Aún no hay entrevistas registradas.</p>";
});

  window.addEventListener("beforeunload", killMic);
  document.addEventListener("visibilitychange", () => { if (document.hidden) killMic(); });
});

function resetCamposPregunta() {
  const ta = $("respuesta");
  if (ta) {
    ta.disabled = false;
    ta.value = "";
    ta.placeholder = "Ingresa tu respuesta antes de que se agote el tiempo.";
  }
  const fbTxt = $("feedbackSTAR"); if (fbTxt) fbTxt.textContent = "";
  const fbScore = $("feedbackScore"); if (fbScore) { fbScore.textContent = ""; }
  const fb = $("feedback"); if (fb) fb.classList.add("hidden");
  const voz = $("btnVoz");
  if (voz) {
    voz.disabled = false;
    voz.classList.remove("btn-disabled","escuchando");
    voz.textContent="Dictar";
    voz.dataset.locked = "0";
  }
const btnEnviar = $("btnEnviar");
if (btnEnviar) {
  btnEnviar.disabled = true;        // se mantiene deshabilitado mientras el textarea está vacío
  btnEnviar.classList.remove("btn-disabled", "procesando");
  btnEnviar.dataset.locked = "0";   // 🔥 este es el importante: desbloquea
}

  updateEnviarDisabled();
}

function onIniciar() {
  killMic(); clearInterval(estado.timerId);

  estado.puestoKey = $("puesto").value;
  const banco = PUESTOS[estado.puestoKey].preguntas;
  estado.preguntas = [...banco].sort(() => Math.random() - 0.5).slice(0, 5);
  estado.indice = 0;
  estado.respuestas = [];
  estado.scores = [];

  hide("pantalla-inicio");
  hide("pantalla-resultados");
  show("pantalla-pregunta");

  const btnMenu = $("btnMenu");
  if (btnMenu) btnMenu.classList.remove("hidden");

  mostrarPregunta();
}

// ========================== PREGUNTA ==========================
function mostrarPregunta() {
  $("puestoActual").textContent = PUESTOS[estado.puestoKey].nombre;
  $("progreso").textContent = `Pregunta ${estado.indice + 1} de ${estado.preguntas.length}`;
  $("textoPregunta").textContent = estado.preguntas[estado.indice];

  const ta = $("respuesta");
  ta.value = "";
  ta.disabled = false;
  ta.placeholder = "Ingresa tu respuesta antes de que se agote el tiempo.";
  ta.focus();

  const btnVoz = $("btnVoz");
  if (btnVoz) {
    btnVoz.disabled = false;
    btnVoz.classList.remove("btn-disabled", "escuchando");
    btnVoz.textContent = "Dictar";
    btnVoz.dataset.locked = "0";
  }

const btnEnviar = $("btnEnviar");
if (btnEnviar) {
  btnEnviar.disabled = true; // inicia desactivado hasta que escriban
  btnEnviar.classList.remove("btn-disabled", "procesando");
  btnEnviar.dataset.locked = "0";  // 🔓 desbloqueado siempre al cargar pregunta nueva
}


  hide("feedback");
  updateEnviarDisabled();
  startTimer(120);
}

// ========================== ENVÍO A GEMINI (feedback estructurado + puntajes ocultos) ==========================
function enviarRespuesta(auto) {
  killMic();
  clearInterval(estado.timerId);

  const btn = $("btnEnviar");
  const btnVoz = $("btnVoz");
  const ta = $("respuesta");
  const txt = ta.value.trim();

// 🔥 FIX PARA CELULARES: feedback visual inmediato
btn.classList.remove("btn-disabled");
btn.offsetHeight; // fuerza repaint en móviles
btn.classList.add("procesando");
btn.disabled = true;

// Bloquear dictado y textarea (esto sí debe quedarse)
if (btnVoz) { 
  btnVoz.disabled = true; 
  btnVoz.classList.add("btn-disabled"); 
  btnVoz.dataset.locked = "1"; 
}
ta.disabled = true;

  if (!txt && !auto) {
    alert("No hay texto. Si se acabó el tiempo, se enviará como vacío.");
    return;
  }

  const sinRespuesta = !txt;
  const respuestaEfectiva = sinRespuesta
    ? "(El candidato no respondió la pregunta dentro del tiempo asignado; ofrece coaching breve usando STAR)."
    : txt;

  evaluarConGemini(respuestaEfectiva, sinRespuesta);
}

async function evaluarConGemini(respuestaEfectiva, sinRespuesta) {
  const pregunta = estado.preguntas[estado.indice];

const prompt = {
  role: "user",
  parts: [{
    text: `Eres un reclutador profesional que evalúa respuestas de candidatos junior.

Tu tarea es devolver EXCLUSIVAMENTE un JSON válido con esta estructura:

{
  "feedback": {
    "analisis": "",
    "fortalezas": "",
    "oportunidades": ""
  },
  "puntajes": {
    "Aprendizaje y Adaptabilidad": 0-100,
    "Orientación a Resultados y Calidad": 0-100,
    "Comunicación y Colaboración": 0-100,
    "Pensamiento Crítico y Resolución de Problemas": 0-100,
    "Autonomía y Proactividad": 0-100,
    "Ética e Integridad Profesional": 0-100
  },
  "puntaje_general": 0-10
}

### REGLAS IMPORTANTES:

1) **Detecta respuestas inválidas.**
   Son inválidas si:
   - Tienen menos de 8 caracteres.
   - Son incoherentes o sin palabras reales (“asdas”, “gggg”, “dsaas”).
   - Contienen groserías, contenido sexual o inadecuado.
   - No responden a la pregunta.
   - Son solo emojis o símbolos.

2) **Si la respuesta es inválida o inapropiada:**
   - "analisis": debe indicar claramente que la respuesta NO es válida.
   - "fortalezas": "Ninguna fortaleza identificada."
   - "oportunidades": "Debe proporcionar una respuesta clara, profesional y relacionada con la pregunta."
   - TODOS los puntajes deben ser **0**.
   - "puntaje_general": **0**

3) **Si la respuesta es válida:**
   - 2 a 4 líneas de análisis profesional.
   - Párrafos sin listas de fortalezas y oportunidades.
   - Puntajes del 0 al 100 (se usan luego para la gráfica).
   - Un "puntaje_general" del 0 al 10 basado en calidad global.
   - No menciones STAR, ni ningún método estructurado.

4) **Nunca envíes nada fuera del JSON.**

Pregunta: ${pregunta}
Respuesta del candidato: """${respuestaEfectiva}"""
`
  }]
};



  try {
    showLoader("Analizando respuesta…");
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [prompt],
        generationConfig: {
          temperature: 0.4,
          candidateCount: 1
        }
      })
    });

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let parsed = null;

    try {
      parsed = safeParseJsonResponse(rawText);
    } catch {
      // Sin JSON válido
      if (!rawText) {
        const finish = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "Desconocido";
        $("feedbackSTAR").textContent = "La IA no generó texto (posible bloqueo o respuesta vacía).";
        $("feedbackScore").textContent = "";
        show("feedback");
        hideLoader();
        return;
      }
      // Mostrar texto plano como fallback, sin puntajes visibles
      $("feedbackSTAR").textContent = rawText;
      $("feedbackScore").textContent = "";
      show("feedback");
      estado.respuestas.push({ pregunta, respuesta: respuestaEfectiva, feedback: { bruto: rawText, puntajes: {} } });
      estado.scores.push(Array(6).fill(0));
      hideLoader();
      return;
    }

    // Con JSON válido
    const fb = parsed?.feedback || {};
    const punt = parsed?.puntajes || {};
    const puntaje10 = parsed?.puntaje_general ?? null;


   const resumen = parsed?.feedback?.analisis || "Sin resumen disponible.";
  const fortalezas = parsed?.feedback?.fortalezas || "Sin fortalezas disponibles.";
  const oportunidades = parsed?.feedback?.oportunidades || "Sin oportunidades disponibles.";
        
  const feedbackCompuesto =
    `Análisis de la respuesta:\n${resumen}\n\n` +
    `Fortalezas:\n${fortalezas}\n\n` +
    `Oportunidades de mejora:\n${oportunidades}`;


    // Construcción visual profesional
$("feedbackSTAR").innerHTML = `
  <div class="feedback-block">
    <div class="feedback-title">🔎 Análisis de la respuesta</div>
    <div class="feedback-text">${resumen}</div>
  </div>

  <div class="feedback-block">
    <div class="feedback-title">⭐ Fortalezas</div>
    <div class="feedback-text">${fortalezas}</div>
  </div>

  <div class="feedback-block">
    <div class="feedback-title">⚠️ Oportunidades de mejora</div>
    <div class="feedback-text">${oportunidades}</div>
  </div>
`;

// Mostrar el puntaje general de 1 a 10
const elPuntaje = $("puntajeGeneral");
if (puntaje10 != null) {
  elPuntaje.textContent = `Puntaje de la respuesta: ${puntaje10}/10`;
  elPuntaje.classList.remove("hidden");
} else {
  elPuntaje.classList.add("hidden");
}


    $("feedbackScore").textContent = ""; // ya no mostramos puntajes por pregunta
    show("feedback");

    // Cálculo de scores para la Spider Chart (sin mostrarlos aquí)
    const s = COMPETENCIAS.map(c => {
      let v = Number(punt[c] ?? 0);
      v = Math.max(0, Math.min(100, v));
      return Math.round(v / 5) * 5;
    });

    estado.respuestas.push({ pregunta, respuesta: respuestaEfectiva, feedback: parsed });
    estado.scores.push(s);

  } catch (e) {
    console.error("Gemini error:", e);
    $("feedbackSTAR").textContent = "Error al conectar con Gemini o al interpretar la respuesta.";
    $("feedbackScore").textContent = "";
    show("feedback");
  } finally {
    hideLoader();
  }
}

// ========================== SIGUIENTE Y RESULTADOS ==========================
function onSiguiente() {
  killMic(); clearInterval(estado.timerId);
  estado.indice++;
  if (estado.indice < estado.preguntas.length) {
    mostrarPregunta();
  } else {
    finalizar();
  }
}

async function finalizar() {
  hide("pantalla-pregunta");
  show("pantalla-resultados");
  // ⭐ FIX: llevar la pantalla al inicio para que no aparezca en medio
setTimeout(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
}, 50);


  // Promedios para la spider chart
  const sum = Array(6).fill(0);
  estado.scores.forEach(s => s.forEach((v, i) => sum[i] += (Number(v) || 0)));
  const n = Math.max(1, estado.scores.length);
  const avg = sum.map(x => Math.round(x / n));

  // Render de radar
  renderRadar(avg);

  // Resumen de texto "técnico" para copiar (lo seguimos usando)

  const btnMenu = $("btnMenu");
  if (btnMenu) btnMenu.classList.add("hidden");

  // Resumen global bonito con IA
  await generarResumenGlobal(avg);

  // Guardar la sesión completa en historial
guardarHistorialSesion({
  resumen: $("resumenTexto").textContent,
  probabilidad: $("resumenProbabilidad").textContent,
  fortalezas: Array.from($("resumenFortalezas").children).map(li => li.textContent),
  mejoras: Array.from($("resumenMejoras").children).map(li => li.textContent)
});
}

// ========================== RESUMEN GLOBAL CON IA ==========================
async function generarResumenGlobal(avg) {
  try {
    showLoader("Generando resumen final…");

    const promedios = {};
    COMPETENCIAS.forEach((c, i) => {
      promedios[c] = avg[i];
    });

    const sesion = {
      puesto: PUESTOS[estado.puestoKey]?.nombre || "",
      promedios,
      preguntas: estado.respuestas.map((r, idx) => ({
        numero: idx + 1,
        pregunta: r.pregunta,
        respuesta: r.respuesta,
        analisis: r.feedback?.feedback?.analisis || "",
        fortalezas: r.feedback?.feedback?.fortalezas || "",
        oportunidades: r.feedback?.feedback?.oportunidades || ""
      }))
    };

    const prompt = {
      role: "user",
      parts: [{
        text: `Eres un reclutador profesional que analiza el desempeño GLOBAL de una entrevista para un candidato junior.

Debes devolver EXCLUSIVAMENTE un JSON válido con ESTA estructura:

{
  "resumen": "Texto de 3 a 5 líneas, en tono profesional, explicando el desempeño general del candidato.",
  "probabilidad_contratacion": "Texto que combine escala + porcentaje, por ejemplo: 'Alta (80%)' o 'Media (55%)'.",
  "fortalezas_globales": [
    "Frase corta con una fortaleza global.",
    "... (máximo 5 elementos)"
  ],
  "mejoras_globales": [
    "Frase corta con un área de mejora global.",
    "... (máximo 5 elementos)"
  ]
}

Reglas:
- No menciones el método STAR ni ningún nombre de método.
- Escribe todo en español neutro, tono profesional y claro.
- NO uses viñetas ni guiones en los textos individuales, solo frases completas.
- "fortalezas_globales" y "mejoras_globales" deben ser arreglos de strings y contener como máximo 5 elementos cada uno.
- No añadas ningún texto fuera del JSON.

A continuación tienes los datos de la sesión (respuestas, análisis por pregunta y promedios por competencia):

${JSON.stringify(sesion, null, 2)}`
      }]
    };

    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [prompt],
        generationConfig: {
          temperature: 0.4,
          candidateCount: 1
        }
      })
    });

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      parsed = safeParseJsonResponse(rawText);
    } catch (e) {
      console.warn("No se pudo parsear el resumen global, uso fallback.", e);
      // Fallback simple usando construirResumen
      $("resumenTexto").textContent =
        "No se pudo generar un resumen detallado con la IA. A continuación tienes un resumen basado en los puntajes promedio.";
      $("resumenProbabilidad").textContent = "No disponible.";
      $("resumenFortalezas").innerHTML = "";
      $("resumenMejoras").innerHTML = "";
      return;
    }

    const resumen = parsed?.resumen || "No se pudo generar un resumen global.";
    const prob = parsed?.probabilidad_contratacion || "No disponible.";
    const fortalezas = Array.isArray(parsed?.fortalezas_globales) ? parsed.fortalezas_globales : [];
    const mejoras = Array.isArray(parsed?.mejoras_globales) ? parsed.mejoras_globales : [];

    // Resumen y probabilidad
    $("resumenTexto").textContent = resumen;
    $("resumenProbabilidad").textContent = prob;

    // Listas con máximo 5 elementos
    // Listas con máximo 5 elementos
const ulFort = $("resumenFortalezas");
const ulMej = $("resumenMejoras");
ulFort.innerHTML = "";
ulMej.innerHTML = "";

// FORTALEZAS — si viene vacío, pon un mensaje
if (fortalezas.length === 0) {
  ulFort.innerHTML = "<li>No se lograron encontrar</li>";
} else {
  fortalezas.slice(0, 5).forEach(f => {
    const li = document.createElement("li");
    li.textContent = f;
    ulFort.appendChild(li);
  });
}

// MEJORAS — si viene vacío, pon un mensaje
if (mejoras.length === 0) {
  ulMej.innerHTML = "<li>No se lograron encontrar</li>";
} else {
  mejoras.slice(0, 5).forEach(m => {
    const li = document.createElement("li");
    li.textContent = m;
    ulMej.appendChild(li);
  });
}


  } catch (e) {
    console.error("Error generando resumen global:", e);
    $("resumenTexto").textContent =
      "Ocurrió un error al generar el resumen final. Aun así, puedes revisar tu radar de competencias.";
    $("resumenProbabilidad").textContent = "No disponible.";
    $("resumenFortalezas").innerHTML = "";
    $("resumenMejoras").innerHTML = "";
  } finally {
    hideLoader();
  }
}


// ========================== CHART & RESUMEN ==========================
function renderRadar(avg) {
const canvas = $("spider");
  const ctx = canvas.getContext("2d");
  const isLight = document.body.classList.contains("light");

  // Tamaño grande del radar
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetWidth;

  if (estado.chart) estado.chart.destroy();

  estado.chart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: COMPETENCIAS,
      datasets: [{
        label: "Tu perfil",
        data: avg,
        fill: true,
        backgroundColor: isLight
          ? "rgba(59,89,255,0.25)"
          : "rgba(255,255,255,0.15)",
        borderColor: isLight ? "#3b59ff" : "#ffffff",
        pointBackgroundColor: isLight ? "#3b59ff" : "#ffffff",
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,

      // Más espacio para que no se corte
      layout: {
        padding: {
          top: 50,
          bottom: 50,
          left: 80,
          right: 80
        }
      },

      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,

          // ⭐ LOS NÚMEROS (10,20,30,...100)
          ticks: {
            showLabelBackdrop: true,
            backdropColor: isLight ? "rgba(255,255,255,0)" : "#000000", 
            color: isLight ? "#121212" : "#ffffff",
            font: {
              size: 10,
              weight: "bold"
            }
          },

          // ⭐ LOS TEXTOS DE LAS COMPETENCIAS
          pointLabels: {
            padding: 10,
            color: isLight ? "#121212" : "#e7ecff",
            font: {
              size: 16,
              weight: "bold",
              family: "'Inter', system-ui, sans-serif"
            }
          },

          // Líneas del grid
          grid: {
            color: isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.4)"
          },

          // Líneas radiales
          angleLines: {
            color: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.5)"
          }
        }
      },

      plugins: {
        legend: { display: false }
      }
    }
  });
}

function construirResumen(avg, respuestas) {
  const fortalezas = [], mejora = [];
  avg.forEach((v, i) => {
    const c = COMPETENCIAS[i];
    if (v >= 70) fortalezas.push(`${c} (${v})`);
    else if (v < 60) mejora.push(`${c} (${v})`);
  });
  let txt = `Resumen de desempeño (promedios):\n`;
  COMPETENCIAS.forEach((c, i) => (txt += `- ${c}: ${avg[i]}/100\n`));
  if (fortalezas.length) txt += `\nFortalezas: ${fortalezas.join("; ")}.\n`;
  if (mejora.length) txt += `Puntos de mejora: ${mejora.join("; ")}.\n`;
  return txt;
}

// ========================== HISTORIAL (LocalStorage) ==========================

// Guarda la sesión completa en LocalStorage
function guardarHistorialSesion(resumenFinal) {
  const historial = JSON.parse(localStorage.getItem("historialEntrevistas") || "[]");

  historial.push({
    fecha: new Date().toLocaleString("es-MX"),
    puesto: PUESTOS[estado.puestoKey]?.nombre || "",
    resumen: resumenFinal.resumen || "",
    probabilidad: resumenFinal.probabilidad || "",
    fortalezas: resumenFinal.fortalezas || [],
    mejoras: resumenFinal.mejoras || [],
    scores: estado.scores
  });

  localStorage.setItem("historialEntrevistas", JSON.stringify(historial));
}

// ========================== EXTRAS ==========================
function descargarGraficoPNG() {
  const canvas = $("spider");
  if (!canvas) return alert("No se encontró el gráfico.");
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `SpiderChart_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;
  a.click();
}

async function copiarResumen() {
  try {
    await navigator.clipboard.writeText($("resumen").textContent);
    const t = $("toast");
    t.textContent = "Resumen copiado";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1500);
  } catch {
    alert("No se pudo copiar al portapapeles.");
  }
}

$("btnPDF")?.addEventListener("click", generarPDF);

async function generarPDF() {
  const pdfArea = $("pdfArea");

  // Construir contenido HTML del PDF
  pdfArea.innerHTML = `
    <h2>Resultados de EntrevistaT</h2>
    <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Puesto evaluado:</strong> ${PUESTOS[estado.puestoKey].nombre}</p>

    <h3>Resumen del desempeño</h3>
    <p>${$("resumenTexto").textContent}</p>

    <h3>Probabilidad de contratación</h3>
    <p>${$("resumenProbabilidad").textContent}</p>

    <h3>Fortalezas generales</h3>
    <ul>${$("resumenFortalezas").innerHTML}</ul>

    <h3>Áreas de mejora</h3>
    <ul>${$("resumenMejoras").innerHTML}</ul>

    <h3>Gráfico radar</h3>
    <img src="${$("spider").toDataURL("image/png")}" style="width:100%;max-width:450px">
  `;

  // Configuración del PDF
  const options = {
    margin: 10,
    filename: `EntrevistaT_${new Date().toISOString().slice(0,10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Generar y descargar
  html2pdf().set(options).from(pdfArea).save();
}

function mostrarHistorial() {
  hide("pantalla-inicio");
  hide("pantalla-pregunta");
  hide("pantalla-resultados");
  show("pantalla-historial");

  const lista = $("listaHistorial");
  const historial = JSON.parse(localStorage.getItem("historialEntrevistas") || "[]");

  if (historial.length === 0) {
    lista.innerHTML = "<p class='muted'>Aún no hay entrevistas registradas.</p>";
    return;
  }

  lista.innerHTML = historial
    .map((h, i) => `
      <div class="hist-item" style="
        border:1px solid var(--color-borde);
        padding:12px;
        border-radius:10px;
        margin-bottom:12px;
      ">
        <div class="hist-header" data-index="${i}" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${h.puesto}</strong><br>
            <span class="muted">${h.fecha}</span><br>
            <strong>🎯 Probabilidad:</strong> ${h.probabilidad}
          </div>
          <span class="arrow"></span>
        </div>

        <div class="hist-detalle hidden" style="margin-top:10px; padding-left:5px;">
          <p><strong>🔍 Resumen:</strong><br>${h.resumen}</p>

          <p><strong>💪 Fortalezas:</strong></p>
          <ul>${h.fortalezas.map(f => `<li>${f}</li>`).join("")}</ul>

          <p><strong>⚠️ Áreas de mejora:</strong></p>
          <ul>${h.mejoras.map(m => `<li>${m}</li>`).join("")}</ul>
        </div>
      </div>
    `)
    .join("");

  // Listener para expandir/colapsar
  document.querySelectorAll(".hist-header").forEach(header => {
    header.addEventListener("click", () => {
      const detalle = header.nextElementSibling;
      const arrow = header.querySelector(".arrow");

      const isOpen = !detalle.classList.contains("hidden");

          if (isOpen) {
        detalle.classList.add("hidden");
        arrow.classList.remove("open");
    } else {
        detalle.classList.remove("hidden");
        arrow.classList.add("open");
    }

    });
  });
}


