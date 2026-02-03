import React, { useState, useEffect } from 'react';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

const ConnectionWarning: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showWarning, setShowWarning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowWarning(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowWarning(true);
    };

    // Check connection status periodically
    const checkConnection = async () => {
      if (!navigator.onLine) {
        handleOffline();
        return;
      }

      try {
        // Try to fetch a small resource to check actual connectivity
        const response = await fetch('https://httpbin.org/status/200', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        handleOnline();
      } catch (error) {
        handleOffline();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Initial check
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      setIsOnline(true);
      setShowWarning(false);
    } catch (error) {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl">
        <div className="mb-6">
          <AlertCircleIcon size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Conexão Instável</h2>
          <p className="text-gray-600">
            O sistema está com problemas de conexão. Verifique sua internet e tente novamente.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircleIcon size={20} className="text-yellow-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Status da Conexão
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>• Navegador: {navigator.onLine ? 'Online' : 'Offline'}</p>
                  <p>• Sistema: {isOnline ? 'Conectado' : 'Desconectado'}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isChecking ? (
              <>
                <RefreshCwIcon size={20} className="mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCwIcon size={20} className="mr-2" />
                Tentar Novamente
              </>
            )}
          </button>

          <div className="text-xs text-gray-500">
            O sistema tentará reconectar automaticamente a cada 30 segundos.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionWarning;
