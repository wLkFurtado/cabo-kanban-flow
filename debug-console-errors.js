// Script para detectar e analisar erros de listener assíncrono
console.log('🔍 [DEBUG] Iniciando monitoramento de erros...');

// Capturar erros não tratados
window.addEventListener('error', (event) => {
  console.log('❌ [ERROR] Erro capturado:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack
  });
});

// Capturar promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
  console.log('❌ [PROMISE ERROR] Promise rejeitada:', {
    reason: event.reason,
    promise: event.promise,
    stack: event.reason?.stack
  });
});

// Monitorar extensões do Chrome
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('🔍 [DEBUG] Chrome runtime detectado');
  
  // Verificar se há listeners ativos
  try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('📨 [DEBUG] Mensagem do Chrome runtime:', request);
      return false; // Não é assíncrono
    });
  } catch (e) {
    console.log('⚠️ [DEBUG] Erro ao adicionar listener Chrome:', e);
  }
}

// Verificar Service Workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('🔍 [DEBUG] Service Workers registrados:', registrations.length);
    registrations.forEach((registration, index) => {
      console.log(`📋 [DEBUG] SW ${index}:`, {
        scope: registration.scope,
        state: registration.active?.state,
        scriptURL: registration.active?.scriptURL
      });
    });
  });
}

// Verificar WebSockets ativos
const originalWebSocket = window.WebSocket;
window.WebSocket = function(...args) {
  const ws = new originalWebSocket(...args);
  console.log('🔌 [DEBUG] WebSocket criado:', args[0]);
  
  ws.addEventListener('open', () => console.log('✅ [DEBUG] WebSocket conectado'));
  ws.addEventListener('close', (e) => console.log('❌ [DEBUG] WebSocket fechado:', e.code, e.reason));
  ws.addEventListener('error', (e) => console.log('💥 [DEBUG] WebSocket erro:', e));
  
  return ws;
};

// Verificar fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 [DEBUG] Fetch request:', args[0]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('✅ [DEBUG] Fetch response:', response.status, args[0]);
      return response;
    })
    .catch(error => {
      console.log('❌ [DEBUG] Fetch error:', error, args[0]);
      throw error;
    });
};

// Verificar React DevTools
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('🔍 [DEBUG] React DevTools detectado');
}

// Verificar outras extensões comuns
const commonExtensions = [
  'window.__REDUX_DEVTOOLS_EXTENSION__',
  'window.__VUE_DEVTOOLS_GLOBAL_HOOK__',
  'window.devToolsExtension'
];

commonExtensions.forEach(ext => {
  if (eval(ext)) {
    console.log(`🔍 [DEBUG] Extensão detectada: ${ext}`);
  }
});

// Monitorar mudanças no DOM que podem indicar extensões
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          const element = node;
          if (element.id && element.id.includes('extension')) {
            console.log('🔍 [DEBUG] Elemento de extensão detectado:', element.id);
          }
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('✅ [DEBUG] Monitoramento ativo. Aguardando erros...');

// Função para testar listeners assíncronos
function testAsyncListener() {
  console.log('🧪 [TEST] Testando listener assíncrono...');
  
  // Simular um listener que retorna true mas não responde
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      chrome.runtime.sendMessage('test', (response) => {
        console.log('📨 [TEST] Resposta recebida:', response);
      });
    } catch (e) {
      console.log('❌ [TEST] Erro no teste:', e);
    }
  }
}

// Executar teste após 2 segundos
setTimeout(testAsyncListener, 2000);

// Função para limpar logs (chamar quando necessário)
window.clearDebugLogs = () => {
  console.clear();
  console.log('🧹 [DEBUG] Logs limpos');
};