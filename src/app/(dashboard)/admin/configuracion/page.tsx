'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, User, X, Image as ImageIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ImageUploader from '@/components/ImageUploader';

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  // --- Mi Perfil State ---
  const [profileName, setProfileName] = useState('');
  const [profileImagen, setProfileImagen] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // --- Global Config State ---
  const [appName, setAppName] = useState('');
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [cotizacionUsd, setCotizacionUsd] = useState<string>('');
  const [ticketHabilitado, setTicketHabilitado] = useState(true);
  const [ticketEmpresa, setTicketEmpresa] = useState('');
  const [ticketContacto, setTicketContacto] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');

  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Load User Profile
      const resMe = await fetch('/api/me');
      if (resMe.ok) {
        const dataMe = await resMe.json();
        setProfileName(dataMe.name || '');
        setProfileImagen(dataMe.imagen || null);
      }

      // 2. Load Global Config (only if Admin, though the API returns it for everyone, we only need it if Admin)
      if (isAdmin) {
        const resConf = await fetch('/api/configuracion');
        if (resConf.ok) {
          const dataConf = await resConf.json();
          setAppName(dataConf.appName || 'Ventas Interno');
          setAppLogo(dataConf.appLogo || null);
          setCotizacionUsd(dataConf.cotizacionUsd?.toString() || '7500');
          setTicketHabilitado(dataConf.ticketHabilitado ?? true);
          setTicketEmpresa(dataConf.ticketEmpresa || 'Sistema Keranai');
          setTicketContacto(dataConf.ticketContacto || 'keranai.com');
        }
      }
    } catch (err) {
      console.error(err);
      setConfigError('Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: profileName,
          imagen: profileImagen
        })
      });

      if (res.ok) {
        setProfileSuccess('Perfil guardado correctamente. Actualizando vista...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const data = await res.json();
        setProfileError(data.error || 'Error al guardar perfil.');
      }
    } catch (err) {
      setProfileError('Error de conexión al guardar.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigError('');
    setConfigSuccess('');

    try {
      const res = await fetch('/api/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cotizacionUsd: Number(cotizacionUsd),
          ticketHabilitado,
          ticketEmpresa,
          ticketContacto,
          appName,
          appLogo
        })
      });

      if (res.ok) {
        setConfigSuccess('Configuración guardada correctamente. Actualizando vista...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const data = await res.json();
        setConfigError(data.error || 'Error al guardar.');
      }
    } catch (err) {
      setConfigError('Error de conexión al guardar.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleProfileImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // 1:1 Crop logic
          const size = Math.min(width, height);
          const x = (width - size) / 2;
          const y = (height - size) / 2;

          const squareCanvas = document.createElement('canvas');
          squareCanvas.width = size;
          squareCanvas.height = size;
          const squareCtx = squareCanvas.getContext('2d');
          squareCtx?.drawImage(canvas, x, y, size, size, 0, 0, size, size);

          const base64 = squareCanvas.toDataURL('image/webp', 0.85);
          setProfileImagen(base64);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error optimizando imagen de perfil:', err);
      alert('Hubo un problema al procesar la imagen.');
    }
  };

  const handleLogoImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // 1:1 Crop for Logo as well
          const size = Math.min(width, height);
          const x = (width - size) / 2;
          const y = (height - size) / 2;

          const squareCanvas = document.createElement('canvas');
          squareCanvas.width = size;
          squareCanvas.height = size;
          const squareCtx = squareCanvas.getContext('2d');
          squareCtx?.drawImage(canvas, x, y, size, size, 0, 0, size, size);

          const base64 = squareCanvas.toDataURL('image/webp', 0.85);
          setAppLogo(base64);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error optimizando logo:', err);
      alert('Hubo un problema al procesar el logo.');
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Cargando...</div>;

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-zinc-400">
        No tienes permisos para acceder a las configuraciones.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-violet-400" /> Configuraciones
        </h1>
        <p className="text-zinc-400 mt-2">Administra tu perfil y ajustes del sistema.</p>
      </div>

      {/* --- MI PERFIL --- */}
      <div className="glass-panel border border-white/10 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-violet-400" /> Mi Perfil
        </h2>

        {profileError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5" />
            <p>{profileError}</p>
          </div>
        )}

        {profileSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3 mb-6">
            <p>{profileSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Foto de Perfil</label>
              <div className="relative">
                {profileImagen ? (
                  <div className="relative group rounded-xl overflow-hidden border-2 border-white/10 cursor-zoom-in" onClick={() => setZoomImage(profileImagen)}>
                    <img src={profileImagen} alt="Perfil" className="w-32 h-32 object-cover transition duration-300 group-hover:scale-110 group-hover:opacity-80" />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setProfileImagen(null); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-black/20 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-zinc-500 relative cursor-pointer hover:bg-white/5 hover:border-violet-500/50 transition">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium">Subir Foto</span>
                    <input type="file" accept="image/*" onChange={handleProfileImageFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre a mostrar</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Ej. Juan Pérez"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-3 font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {savingProfile ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </form>
      </div>

      {/* --- AJUSTES GLOBALES (SOLO ADMIN) --- */}
      {isAdmin && (
        <div className="glass-panel border border-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Ajustes Globales (Sistema)</h2>

          {configError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5" />
              <p>{configError}</p>
            </div>
          )}

          {configSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3 mb-6">
              <p>{configSuccess}</p>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-6">
            
            {/* Apariencia */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-300 mb-4 border-b border-white/10 pb-2">Apariencia</h3>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Logo del Sistema</label>
                  <div className="relative">
                    {appLogo ? (
                      <div className="relative group rounded-xl overflow-hidden border-2 border-white/10 cursor-zoom-in" onClick={() => setZoomImage(appLogo)}>
                        <img src={appLogo} alt="Logo" className="w-32 h-32 object-cover transition duration-300 group-hover:scale-110 group-hover:opacity-80" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAppLogo(null); }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-xl bg-black/20 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-zinc-500 relative cursor-pointer hover:bg-white/5 hover:border-violet-500/50 transition">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs font-medium">Subir Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoImageFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre del Sistema</label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Ej. Ventas Interno"
                  />
                  <p className="text-xs text-zinc-500 mt-2">Este nombre aparecerá en el menú lateral y otros lugares clave.</p>
                </div>
              </div>
            </div>

            {/* Cotización */}
            <div className="pt-6 mt-6 border-t border-white/10">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Cotización del Dólar (USD)</label>
              <p className="text-xs text-zinc-500 mb-4">
                Valor utilizado en el Punto de Venta al pagar en Dólares.
              </p>
              <div className="relative max-w-sm">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₲</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={cotizacionUsd}
                  onChange={e => setCotizacionUsd(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Ej. 7500"
                />
              </div>
            </div>

            {/* Ticket */}
            <div className="pt-6 mt-6 border-t border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Impresión de Ticket</h2>
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setTicketHabilitado(!ticketHabilitado)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    ticketHabilitado ? 'bg-violet-600' : 'bg-zinc-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      ticketHabilitado ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-zinc-300 font-medium">
                  {ticketHabilitado ? 'Habilitado' : 'Desactivado'}
                </span>
              </div>

              {ticketHabilitado && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Título (Nombre de Empresa)</label>
                    <input
                      type="text"
                      value={ticketEmpresa}
                      onChange={e => setTicketEmpresa(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Ej. Mi Tienda S.A."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Contacto / Red Social / Web</label>
                    <input
                      type="text"
                      value={ticketContacto}
                      onChange={e => setTicketContacto(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Ej. wa.me/123456789"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-3 font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {savingConfig ? 'Guardando...' : 'Guardar Ajustes Globales'}
            </button>
          </form>
        </div>
      )}

      {/* Lightbox para Imágenes */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <img 
            src={zoomImage} 
            alt="Zoomed" 
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-white/10"
          />
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            onClick={() => setZoomImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
