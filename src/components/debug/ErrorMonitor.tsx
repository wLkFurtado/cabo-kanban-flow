import { useEffect, useState } from 'react';

interface ErrorLog {
  id: string;
  timestamp: string;
  type: 'error' | 'promise' | 'warning';
  message: string;
  details?: unknown;
}

export function ErrorMonitor() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Safe accessor for window properties to avoid TS index signature errors
  const getWinProp = (key: string): unknown => {
    try {
      const w = window as unknown as Record<string, unknown>;
      return w[key];
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    const errorLogs: ErrorLog[] = [];

    // Capturar erros gerais
    const handleError = (event: ErrorEvent) => {
      const errorLog: ErrorLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        message: event.message,
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      };
      
      errorLogs.push(errorLog);
      setErrors([...errorLogs]);
      
      // Log específico para o erro que você está vendo
      if (event.message.includes('listener indicated an asynchronous response')) {
        console.log('🎯 [DETECTED] Erro de listener assíncrono capturado:', errorLog);
      }
    };

    // Capturar promises rejeitadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorLog: ErrorLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'promise',
        message: event.reason?.message || 'Promise rejeitada',
        details: {
          reason: event.reason,
          stack: event.reason?.stack
        }
      };
      
      errorLogs.push(errorLog);
      setErrors([...errorLogs]);
    };

    // Interceptar console.error para capturar erros do React/Vite
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('listener indicated an asynchronous response')) {
        const errorLog: ErrorLog = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'warning',
          message: 'Listener assíncrono detectado',
          details: { args }
        };
        
        errorLogs.push(errorLog);
        setErrors([...errorLogs]);
        
        console.log('🎯 [INTERCEPTED] Erro de listener capturado via console.error');
      }
      
      originalConsoleError.apply(console, args);
    };

    // Verificar extensões do navegador
    const checkBrowserExtensions = () => {
      const extensionChecks = [
        { name: 'Chrome Runtime', check: () => typeof getWinProp('chrome') !== 'undefined' && Boolean(getWinProp('chrome')) },
        { name: 'React DevTools', check: () => Boolean(getWinProp('__REACT_DEVTOOLS_GLOBAL_HOOK__')) },
        { name: 'Redux DevTools', check: () => Boolean(getWinProp('__REDUX_DEVTOOLS_EXTENSION__')) },
      ];

      extensionChecks.forEach(({ name, check }) => {
        if (check()) {
          console.log(`🔍 [EXTENSION] ${name} detectado`);
        }
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    checkBrowserExtensions();

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  // Atalho para mostrar/esconder o monitor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
        >
          🐛 Debug ({errors.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-80 bg-black text-green-400 p-4 rounded-lg shadow-lg z-50 overflow-auto font-mono text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-bold">🐛 Error Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setErrors([])}
            className="text-yellow-400 hover:text-yellow-300"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mb-2">
        Ctrl+Shift+E para toggle | Total: {errors.length} erros
      </div>

      {errors.length === 0 ? (
        <div className="text-gray-500">Nenhum erro detectado</div>
      ) : (
        <div className="space-y-2">
          {errors.slice(-10).map((error) => (
            <div key={error.id} className="border-l-2 border-red-500 pl-2">
              <div className="flex justify-between">
                <span className={`
                  ${error.type === 'error' ? 'text-red-400' : ''}
                  ${error.type === 'promise' ? 'text-orange-400' : ''}
                  ${error.type === 'warning' ? 'text-yellow-400' : ''}
                `}>
                  {error.type.toUpperCase()}
                </span>
                <span className="text-gray-500">{error.timestamp}</span>
              </div>
              <div className="text-white">{error.message}</div>
              {error.details && (
                <details className="text-gray-400 mt-1">
                  <summary className="cursor-pointer">Detalhes</summary>
                  <pre className="mt-1 text-xs overflow-auto">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}