"use client";
import { useState, useEffect } from "react";

interface TiempoRestante {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  expirado: boolean;
  enPeriodoValido: boolean;
}

function calcularTiempoHastaSabado(): TiempoRestante {
  const ahora = new Date();
  const diaSemana = ahora.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado

  // Si es domingo (0), no está en periodo válido
  if (diaSemana === 0) {
    return {
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
      expirado: true,
      enPeriodoValido: false,
    };
  }

  // Calcular el próximo sábado a las 23:59:59
  const proximoSabado = new Date(ahora);
  const diasHastaSabado = 6 - diaSemana; // días que faltan para sábado
  proximoSabado.setDate(ahora.getDate() + diasHastaSabado);
  proximoSabado.setHours(23, 59, 59, 999);

  const diferencia = proximoSabado.getTime() - ahora.getTime();

  if (diferencia <= 0) {
    return {
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
      expirado: true,
      enPeriodoValido: true, // Técnicamente sí está en lunes-sábado, solo que expiró
    };
  }

  const segundosTotales = Math.floor(diferencia / 1000);
  const dias = Math.floor(segundosTotales / (60 * 60 * 24));
  const horas = Math.floor((segundosTotales % (60 * 60 * 24)) / (60 * 60));
  const minutos = Math.floor((segundosTotales % (60 * 60)) / 60);
  const segundos = segundosTotales % 60;

  return {
    dias,
    horas,
    minutos,
    segundos,
    expirado: false,
    enPeriodoValido: true,
  };
}

interface ContadorTiempoProps {
  mostrarEnCard?: boolean;
}

export default function ContadorTiempo({ mostrarEnCard = false }: ContadorTiempoProps) {
  const [tiempo, setTiempo] = useState<TiempoRestante>(calcularTiempoHastaSabado());

  useEffect(() => {
    const intervalo = setInterval(() => {
      setTiempo(calcularTiempoHastaSabado());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  // Si no está en periodo válido (domingo)
  if (!tiempo.enPeriodoValido) {
    return (
      <div className={mostrarEnCard ? "text-center py-2" : "bg-gray-100 border-2 border-gray-300 rounded-lg p-4"}>
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <span className="text-2xl">🚫</span>
          <div>
            <div className="font-bold">Periodo cerrado</div>
            <div className="text-sm">Las planeaciones se crean de lunes a sábado</div>
          </div>
        </div>
      </div>
    );
  }

  // Si expiró el plazo
  if (tiempo.expirado) {
    return (
      <div className={mostrarEnCard ? "text-center py-2" : "bg-red-50 border-2 border-red-300 rounded-lg p-4"}>
        <div className="flex items-center justify-center gap-2 text-red-700">
          <span className="text-2xl">⏰</span>
          <div>
            <div className="font-bold">Plazo vencido</div>
            <div className="text-sm">No puedes enviar planeaciones hasta el próximo lunes</div>
          </div>
        </div>
      </div>
    );
  }

  // Determinar color según tiempo restante
  const getColorClasses = () => {
    const horasTotales = tiempo.dias * 24 + tiempo.horas;
    if (horasTotales < 6) return "bg-red-50 border-red-300 text-red-700";
    if (horasTotales < 24) return "bg-orange-50 border-orange-300 text-orange-700";
    return "bg-green-50 border-green-300 text-green-700";
  };

  if (mostrarEnCard) {
    return (
      <div className="text-center py-2">
        <div className="text-sm font-semibold text-gray-600">⏱️ Tiempo restante:</div>
        <div className="text-xl font-bold text-blue-600 mt-1">
          {tiempo.dias > 0 && `${tiempo.dias}d `}
          {tiempo.horas}h {tiempo.minutos}m
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 rounded-lg p-4 ${getColorClasses()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⏱️</span>
          <div>
            <div className="font-bold text-lg">Tiempo restante para enviar</div>
            <div className="text-sm opacity-90">Plazo hasta sábado 23:59</div>
          </div>
        </div>
        <div className="flex gap-2">
          {tiempo.dias > 0 && (
            <div className="bg-white bg-opacity-50 rounded-lg px-4 py-2 text-center min-w-[70px]">
              <div className="text-2xl font-bold">{tiempo.dias}</div>
              <div className="text-xs uppercase">Días</div>
            </div>
          )}
          <div className="bg-white bg-opacity-50 rounded-lg px-4 py-2 text-center min-w-[70px]">
            <div className="text-2xl font-bold">{tiempo.horas}</div>
            <div className="text-xs uppercase">Horas</div>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg px-4 py-2 text-center min-w-[70px]">
            <div className="text-2xl font-bold">{tiempo.minutos}</div>
            <div className="text-xs uppercase">Min</div>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg px-4 py-2 text-center min-w-[70px]">
            <div className="text-2xl font-bold">{tiempo.segundos}</div>
            <div className="text-xs uppercase">Seg</div>
          </div>
        </div>
      </div>
    </div>
  );
}
