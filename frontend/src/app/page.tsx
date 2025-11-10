"use client";

import Link from 'next/link';
import { useState } from 'react';
import AuthModal from '../components/AuthModal';

export default function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  return (
    <>
      {/* Navegación Fija (Similar a Apple) */}
      <header
        className="sticky top-0 z-50 bg-white bg-opacity-90 backdrop-blur-md shadow-lg"
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16"
        >
          <div className="text-2xl font-black tracking-tight">
            <span className="text-blue-600">Helix</span>
            <span className="text-gray-900">AI</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            <Link href="#proceso" className="text-gray-600 hover:text-blue-600 transition duration-150">
              Proceso
            </Link>
            <Link href="#funciones" className="text-gray-600 hover:text-blue-600 transition duration-150">
              Funciones
            </Link>
            <Link href="#beneficios" className="text-gray-600 hover:text-blue-600 transition duration-150">
              Beneficios
            </Link>
            <Link href="#planes" className="text-gray-600 hover:text-blue-600 transition duration-150">
              Precios
            </Link>
          </nav>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            id="login-button"
            className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 btn-primary hidden sm:block"
          >
            Iniciar Sesión
          </button>
          <button className="md:hidden text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Sección Hero Principal (Mayor Impacto Visual) */}
      <section className="hero text-center py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-gray-900 mb-6">
            <span className="block text-blue-600">El Experto de Tu Negocio,</span>
            Disponible 24/7.
          </h1>
          <p
            className="text-2xl text-gray-500 mb-10 max-w-4xl mx-auto font-light"
          >
            Entrena una IA inteligente con tus propios archivos en
            minutos. Transforma el soporte en ventas y la información en
            ingresos.
          </p>
          <div className="space-x-4">
            <Link
              href="#planes"
              className="bg-blue-600 text-white px-10 py-4 rounded-full text-xl font-bold btn-primary"
            >
              Comprar Créditos Ahora
            </Link>
            <Link
              href="#proceso"
              className="text-gray-700 border border-gray-300 px-10 py-4 rounded-full text-xl font-semibold hover:bg-gray-200 transition duration-150 shadow-md"
            >
              Ver Demo
            </Link>
          </div>
          {/* Visualización del Chatbot con Estilo Moderno */}
          <div className="mt-20 flex justify-center">
            <div
              className="relative w-full max-w-5xl h-[28rem] rounded-3xl bg-white border-2 border-gray-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-6"
            >
              {/* Cabecera de Chat */}
              <div
                className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl -m-6 mb-6"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 bg-green-500 rounded-full"
                  ></div>
                  <span className="font-semibold text-gray-800"
                  >Helix Bot - Activo</span
                  >
                </div>
                <span className="text-sm text-gray-400">En línea</span>
              </div>
              {/* Simulación de Conversación */}
              <div className="space-y-4 h-64 overflow-y-auto">
                <div className="flex justify-start">
                  <div
                    className="bg-blue-100 p-3 rounded-xl max-w-xs text-left shadow-sm"
                  >
                    Hola, soy Helix. ¿En qué puedo ayudarte hoy
                    con tu catálogo de productos?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div
                    className="bg-blue-600 text-white p-3 rounded-xl max-w-xs text-right shadow-md"
                  >
                    &quot;¿Cuál es el precio del modelo Pro y qué
                    incluye?&quot;
                  </div>
                </div>
                <div className="flex justify-start">
                  <div
                    className="bg-blue-100 p-3 rounded-xl max-w-xs text-left shadow-sm"
                  >
                    &quot;El modelo Pro incluye el paquete de 2500
                    créditos (mensajes) y la Tabla de Gestión de
                    Leads PRO. Toda la información está
                    detallada en el PDF &quot;Precios 2025&quot; que
                    subiste.&quot;
                  </div>
                </div>
              </div>
              {/* Input del Chat */}
              <div
                className="absolute bottom-6 left-6 right-6 p-4 bg-gray-100 rounded-xl border border-gray-200"
              >
                <input
                  type="text"
                  placeholder="Escribe tu pregunta..."
                  className="w-full bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NUEVA SECCIÓN: ¿Qué Puedes Hacer? (Funcionalidades) */}
      <section id="funciones" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Un Solo Agente IA. Mil Conversaciones al Mismo Tiempo.
          </h2>
          <p className="text-xl text-gray-500 mb-16 max-w-4xl mx-auto">
            HelixAI automatiza las tareas críticas de tu negocio con
            precisión y un toque humano. Cero espera.
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Función 1: Atender Clientes */}
            <div
              className="card bg-white p-6 rounded-3xl border border-gray-200"
            >
              <div
                className="w-16 h-16 flex items-center justify-center bg-purple-100 rounded-xl mb-4 mx-auto"
              >
                {/* Icono Venta 24/7 */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6D28D9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">
                Ventas y Soporte 24/7
              </h3>
              <p className="text-gray-600 text-sm">
                Atiende clientes en procesos de venta, cobranza, y
                soporte, sin importar la hora o el día.
              </p>
            </div>

            {/* Función 2: Generación de Leads */}
            <div
              className="card bg-white p-6 rounded-3xl border border-gray-200"
            >
              <div
                className="w-16 h-16 flex items-center justify-center bg-purple-100 rounded-xl mb-4 mx-auto"
              >
                {/* Icono Leads */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6D28D9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                  />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">
                Generación de Leads Calificados
              </h3>
              <p className="text-gray-600 text-sm">
                Detecta la intención de compra y aumenta tu tasa de
                conversión con atención personalizada por IA.
              </p>
            </div>

            {/* Función 3: Promociones Automáticas */}
            <div
              className="card bg-white p-6 rounded-3xl border border-gray-200"
            >
              <div
                className="w-16 h-16 flex items-center justify-center bg-purple-100 rounded-xl mb-4 mx-auto"
              >
                {/* Icono Promociones */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6D28D9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12V7H5v5" />
                  <path d="M21 7L12 18 5 7" />
                  <path d="M17 17a2 2 0 1 0-4 0 2 2 0 0 0 4 0z" />
                  <path d="M7 17a2 2 0 1 0-4 0 2 2 0 0 0 4 0z" />
                  <path d="M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">
                Envío de Promociones (Broadcast)
              </h3>
              <p className="text-gray-600 text-sm">
                Envía promociones y mensajes masivos
                automáticamente, segmentados según la conversación
                con el cliente.
              </p>
            </div>

            {/* Función 4: Omnicanalidad y Métricas */}
            <div
              className="card bg-white p-6 rounded-3xl border border-gray-200"
            >
              <div
                className="w-16 h-16 flex items-center justify-center bg-purple-100 rounded-xl mb-4 mx-auto"
              >
                {/* Icono Omnicanal */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6D28D9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"
                  />
                  <path d="M16 8h-6" />
                  <path d="M12 12h-2" />
                  <path d="M12 16h-2" />
                  <rect
                    x="16"
                    y="16"
                    width="6"
                    height="6"
                    rx="1"
                  />
                  <path d="M19 13v3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">
                Omnicanalidad y Métricas
              </h3>
              <p className="text-gray-600 text-sm">
                Gestión de chats centralizada y reportes en tiempo
                real para WhatsApp, Web y más canales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección: Cómo Funciona (El Poder de la IA y tus Archivos) */}
      <section id="proceso" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            La Formación de IA más Sencilla. ¡Tan Fácil!
          </h2>
          <p className="text-xl text-gray-500 mb-16 max-w-4xl mx-auto">
            Cualquier persona puede crear su propio agente IA sin saber
            programar. Nuestros clientes resaltan la facilidad de uso.
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Paso 1 */}
            <div
              className="card bg-gray-50 p-10 rounded-3xl border border-gray-100 text-left"
            >
              <div
                className="w-14 h-14 flex items-center justify-center bg-blue-500 rounded-full mb-6 mx-auto md:mx-0"
              >
                {/* Icono 1: Subida */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.35"
                  />
                  <path d="M12 18v-6" />
                  <path d="m15 15-3-3-3 3" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">
                1. Sube tu Mente Maestra
              </h3>
              <p className="text-gray-600">
                Simplemente arrastra y suelta tu documentación clave
                (catálogos, manuales de soporte, FAQs) en tu panel
                de control. Listo.
              </p>
            </div>

            {/* Paso 2 */}
            <div
              className="card bg-gray-50 p-10 rounded-3xl border border-gray-100 text-left"
            >
              <div
                className="w-14 h-14 flex items-center justify-center bg-blue-500 rounded-full mb-6 mx-auto md:mx-0"
              >
                {/* Icono 2: Cerebro/IA */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 11V2" />
                  <path
                    d="M22 13V10a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4"
                  />
                  <path d="m14 20-2-2-2 2" />
                  <path d="m15.5 13.5 1 1" />
                  <path d="M8.5 13.5 7.5 14.5" />
                  <path d="M19 16.5c.6-.4 1-1.2 1-2v-1.1" />
                  <path d="M5 16.5c-.6-.4-1-1.2-1-2V13" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">
                2. Procesamiento Inteligente
              </h3>
              <p className="text-gray-600">
                Nuestra IA hace el trabajo pesado: lee, indexa y
                memoriza tu información, creando un experto digital
                con un 100% de conocimiento sobre tus productos.
              </p>
            </div>

            {/* Paso 3 */}
            <div
              className="card bg-gray-50 p-10 rounded-3xl border border-gray-100 text-left"
            >
              <div
                className="w-14 h-14 flex items-center justify-center bg-blue-500 rounded-full mb-6 mx-auto md:mx-0"
              >
                {/* Icono 3: Chat */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">
                3. Activación y Ventas
              </h3>
              <p className="text-gray-600">
                Conecta el bot a tu canal preferido y empieza a
                responder consultas y generar leads
                instantáneamente. Recarga créditos cuando los
                necesites.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NUEVA SECCIÓN: Beneficios con Datos (El "Lo Necesito") */}
      <section id="beneficios" className="py-24 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Beneficios Clave: Cifras que Transforman tu Negocio.
          </h2>
          <p className="text-xl text-blue-100 mb-16 max-w-4xl mx-auto">
            Integra HelixAI y comienza a ver resultados tangibles desde
            el primer mes, comprobados por nuestros clientes.
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Data Stat 1: Productividad */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 flex items-center justify-center stat-icon rounded-full mb-4"
              >
                {/* Icono: Gráfico de Aumento */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m18.5 9.5-6.5 6.5-5-5" />
                </svg>
              </div>
              <p className="text-5xl font-black mb-2 text-white">
                hasta un 50%
              </p>
              <p className="text-lg text-blue-200">
                Aumento de productividad de tus agentes de soporte.
              </p>
            </div>

            {/* Data Stat 2: Tiempos de Espera */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 flex items-center justify-center stat-icon rounded-full mb-4"
              >
                {/* Icono: Reloj / Reducción de tiempo */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-5xl font-black mb-2 text-white">
                30 - 40%
              </p>
              <p className="text-lg text-blue-200">
                Reducción en tiempos de espera y atención al
                cliente.
              </p>
            </div>

            {/* Data Stat 3: Tasa de Compra */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 flex items-center justify-center stat-icon rounded-full mb-4"
              >
                {/* Icono: Carrito de Compra/Conversión */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path
                    d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.58L23 6H6"
                  />
                </svg>
              </div>
              <p className="text-5xl font-black mb-2 text-white">
                10 - 15% más
              </p>
              <p className="text-lg text-blue-200">
                Aumento en la tasa de compra gracias a la inmediatez
                del Agente IA.
              </p>
            </div>
          </div>

          {/* Cita sobre Innovación */}
          <div
            className="mt-20 max-w-3xl mx-auto p-8 bg-blue-700 rounded-2xl shadow-xl"
          >
            <blockquote
              className="text-2xl italic font-serif leading-relaxed text-blue-100"
            >
              &quot;El 72% de los consumidores percibe las marcas con
              atención IA como más innovadoras, lo que mejora el
              posicionamiento competitivo.&quot;
            </blockquote>
          </div>
        </div>
      </section>

      {/* Sección: Gestión de Leads Integrada (Visual Mejorado) */}
      <section id="leads" className="py-24 bg-white">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between space-y-12 md:space-y-0 md:space-x-16"
        >
          {/* Texto */}
          <div className="md:w-1/2 text-left">
            <p
              className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-3"
            >
              CRM LITE INTEGRADO
            </p>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Tu Chatbot es un Vendedor Silencioso.
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Cada interacción con tu chatbot se registra
              automáticamente en nuestra **Tabla de Gestión de
              Leads**. No más oportunidades perdidas; tu equipo de
              ventas tiene un resumen instantáneo de los clientes
              potenciales más calificados.
            </p>
            <ul className="space-y-3 text-lg text-gray-700">
              <li className="flex items-start">
                <span
                  className="text-green-500 text-2xl mr-3 leading-none"
                >✓</span
                >
                **Puntuación de Interés (Scoring):** La IA etiqueta
                a los usuarios listos para comprar.
              </li>
              <li className="flex items-start">
                <span
                  className="text-green-500 text-2xl mr-3 leading-none"
                >✓</span
                >
                **Historial Detallado:** Ve las preguntas exactas
                que hizo el lead.
              </li>
              <li className="flex items-start">
                <span
                  className="text-green-500 text-2xl mr-3 leading-none"
                >✓</span
                >
                **Exportación Simple:** Exporta tu lista de leads
                con un solo clic.
              </li>
            </ul>
          </div>
          {/* Visual Placeholder (Dashboard Mockup) */}
          <div className="md:w-1/2 flex justify-center">
            <div
              className="relative w-full max-w-lg h-72 rounded-xl bg-white border border-gray-200 shadow-2xl p-4 overflow-hidden"
            >
              <div
                className="text-lg font-semibold mb-3 border-b pb-2 text-gray-800"
              >
                Leads Calificados (Últimas 24h)
              </div>
              <table className="w-full text-sm text-left text-gray-500">
                <thead
                  className="text-xs text-gray-700 uppercase bg-gray-50"
                >
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      Contacto
                    </th>
                    <th scope="col" className="px-3 py-2">Score</th>
                    <th scope="col" className="px-3 py-2">
                      Última Pregunta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td
                      className="px-3 py-3 font-medium text-gray-900"
                    >
                      Laura M.
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      >ALTO</span
                      >
                    </td>
                    <td className="px-3 py-3">
                      &quot;¿Hay descuento por volumen?&quot;
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td
                      className="px-3 py-3 font-medium text-gray-900"
                    >
                      Carlos R.
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      >MEDIO</span
                      >
                    </td>
                    <td className="px-3 py-3">
                      &quot;¿Qué archivos subo?&quot;
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td
                      className="px-3 py-3 font-medium text-gray-900"
                    >
                      Elena F.
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      >ALTO</span
                      >
                    </td>
                    <td className="px-3 py-3">
                      &quot;Necesito 5.000 mensajes.&quot;
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Testimonios (Prueba Social) */}
      <section id="testimonios" className="py-24 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            Nuestros Clientes lo Confirman. La IA que Genera Confianza.
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonio 1 */}
            <div
              className="card bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl"
            >
              <p
                className="text-2xl font-serif text-gray-800 mb-6 leading-relaxed"
              >
                &quot;La subida de archivos es revolucionaria. Nuestro
                bot contestó correctamente sobre un producto nicho
                en segundos. ¡Increíble la precisión!&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm"
                >
                  JS
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Juan S., Director de E-commerce
                  </p>
                  <p className="text-sm text-gray-500">
                    Tienda de Electrónica
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonio 2 */}
            <div
              className="card bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl"
            >
              <p
                className="text-2xl font-serif text-gray-800 mb-6 leading-relaxed"
              >
                &quot;Necesitábamos un modelo por créditos y HelixAI fue
                la solución perfecta. Control total de nuestro gasto
                y una IA super inteligente.&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm"
                >
                  MG
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    María G., Gerente de Soporte
                  </p>
                  <p className="text-sm text-gray-500">
                    Agencia de Viajes
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonio 3 */}
            <div
              className="card bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl"
            >
              <p
                className="text-2xl font-serif text-gray-800 mb-6 leading-relaxed"
              >
                &quot;Teníamos 10.000 mensajes sin contestar. Con 5.000
                créditos de HelixAI, solucionamos el cuello de
                botella en 48 horas. Simplemente funciona.&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm"
                >
                  AL
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Andrés L., Pyme Digital
                  </p>
                  <p className="text-sm text-gray-500">
                    Consultoría Legal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Precios (Planes de Créditos/Mensajes) */}
      <section id="planes" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Elige Tu Paquete de Créditos. Poder Ilimitado, Gasto
            Controlado.
          </h2>
          <p className="text-xl text-gray-500 mb-16 max-w-4xl mx-auto">
            Nuestros planes se adaptan a tu volumen de clientes. Compra
            solo los mensajes que uses. Cero sorpresas.
          </p>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: 1500 Mensajes */}
            <div
              className="plan card bg-gray-50 p-8 rounded-3xl border border-gray-200 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Iniciador
                </h3>
                <p
                  className="text-sm font-semibold uppercase text-gray-500 mb-1"
                >
                  El punto de partida ideal
                </p>
                <p
                  className="text-5xl font-extrabold text-blue-600 my-6"
                >
                  1.500
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  Créditos de Mensajes IA
                </p>
                <ul className="text-left space-y-3 text-gray-700 mb-10">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    **Tabla de Gestión de Leads (CRM Lite)**
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span> 1
                    Espacio para Archivo de Negocio
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Acceso a 1 Canal (Web/WhatsApp)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Soporte por Email Estándar
                  </li>
                </ul>
              </div>
              <Link
                href="#"
                className="btn-primary bg-gray-100 text-gray-800 border border-gray-300 py-3 rounded-full font-semibold hover:bg-gray-200 text-center"
              >
                Comprar por [Precio X]
              </Link>
            </div>

            {/* Plan 2: 2500 Mensajes (Destacado - Más Atractivo) */}
            <div
              className="plan card plan-destacado text-white p-10 rounded-3xl border border-blue-800 flex flex-col justify-between shadow-2xl transform scale-105"
            >
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest bg-white text-blue-600 px-3 py-1 rounded-full inline-block mb-3"
                >
                  ⭐ MÁS POPULAR
                </p>
                <h3 className="text-3xl font-bold mb-2">Negocio Pro</h3>
                <p
                  className="text-sm font-semibold uppercase opacity-90 mb-1"
                >
                  El mejor balance para crecer
                </p>
                <p className="text-6xl font-black my-6">2.500</p>
                <p className="text-xl mb-8 opacity-90">
                  Créditos de Mensajes IA
                </p>
                <ul className="text-left space-y-3 mb-10">
                  <li className="flex items-center">
                    <span className="text-yellow-300 mr-2">★</span>
                    **Tabla de Gestión de Leads PRO**
                    (Integración Avanzada)
                  </li>
                  <li className="flex items-center">
                    <span className="text-yellow-300 mr-2">★</span>
                    3 Espacios para Archivos de Negocio
                  </li>
                  <li className="flex items-center">
                    <span className="text-yellow-300 mr-2">★</span>
                    Acceso a 3 Canales Integrados
                  </li>
                  <li className="flex items-center">
                    <span className="text-yellow-300 mr-2">★</span>
                    Soporte Prioritario 24/7
                  </li>
                  <li className="flex items-center">
                    <span className="text-yellow-300 mr-2">★</span>
                    Análisis de Rendimiento Completo
                  </li>
                </ul>
              </div>
              <Link
                href="#"
                className="btn-primary bg-white text-blue-600 py-4 rounded-full text-lg font-bold hover:bg-gray-100 text-center shadow-lg"
              >
                Comprar por [Precio Y]
              </Link>
            </div>

            {/* Plan 3: 5000 Mensajes */}
            <div
              className="plan card bg-gray-50 p-8 rounded-3xl border border-gray-200 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Escala Máxima
                </h3>
                <p
                  className="text-sm font-semibold uppercase text-gray-500 mb-1"
                >
                  Para grandes volúmenes de tráfico
                </p>
                <p
                  className="text-5xl font-extrabold text-blue-600 my-6"
                >
                  5.000
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  Créditos de Mensajes IA
                </p>
                <ul className="text-left space-y-3 text-gray-700 mb-10">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    **Tabla de Gestión de Leads Avanzada**
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span> 5
                    Espacios para Archivos de Negocio
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Canales Ilimitados
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Consultoría de IA Dedicada
                  </li>
                </ul>
              </div>
              <Link
                href="#"
                className="btn-primary bg-gray-100 text-gray-800 border border-gray-300 py-3 rounded-full font-semibold hover:bg-gray-200 text-center"
              >
                Comprar por [Precio Z]
              </Link>
            </div>
          </div>

          <p className="mt-16 text-center text-sm text-gray-500">
            *Los precios de ejemplo ([Precio X], [Precio Y], [Precio Z])
            deben ser reemplazados por los precios reales en dólares o
            tu moneda local.
          </p>
        </div>
      </section>

      {/* Llamada a la Acción Final */}
      <section className="py-24 bg-gray-900 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4 text-white">
            No Esperes Más. El Futuro del Soporte es Ahora.
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Comienza tu transformación digital y obtén acceso a un
            Agente IA experto en tu negocio.
          </p>
          <Link
            href="#"
            className="bg-blue-600 text-white px-12 py-4 rounded-full text-xl font-black hover:bg-blue-700 btn-primary shadow-xl"
          >
            ¡Quiero Mi Chatbot Experto!
          </Link>
        </div>
      </section>

      {/* Pie de Página */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-700">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm grid md:grid-cols-4 gap-8"
        >
          <div>
            <h4 className="font-black text-lg mb-4 text-blue-400">
              HelixAI
            </h4>
            <p className="text-gray-400">
              Innovación en soporte y atención impulsada por IA, hecha
              simple.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Empresa</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="#" className="hover:text-white"
                >Sobre Nosotros</Link
                >
              </li>
              <li>
                <Link href="#" className="hover:text-white">Carreras</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">Contacto</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Soporte</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="#" className="hover:text-white"
                >Centro de Ayuda</Link
                >
              </li>
              <li>
                <Link href="#" className="hover:text-white"
                >Términos del Servicio</Link
                >
              </li>
              <li>
                <Link href="#" className="hover:text-white"
                >Política de Privacidad</Link
                >
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Síguenos</h4>
            <div className="flex space-x-4 text-gray-400">
              <Link href="#" className="hover:text-white">FB</Link>
              <Link href="#" className="hover:text-white">IG</Link>
              <Link href="#" className="hover:text-white">LN</Link>
            </div>
          </div>
        </div>
        <div className="text-center mt-12 text-gray-500 text-xs">
          &copy; 2025 HelixAI. Todos los derechos reservados.
        </div>
      </footer>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
