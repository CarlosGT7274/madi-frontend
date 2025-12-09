# 📊 Módulo de Nóminas - Integración con Planeaciones

## 🎯 ¿Qué hace este módulo?

Este módulo conecta **Planeaciones → Horas Trabajadas → Nóminas** de forma automática.

## 🔗 Flujo de Trabajo

```
PLANEACIONES (aprobadas)
    ↓
ASIGNACIONES (empleado_id + horas_trabajadas)
    ↓
CÁLCULO AUTOMÁTICO DE NÓMINA
    ↓
Horas normales + Horas extra + Deducciones = Neto a pagar
```

## 📍 Rutas Principales

### Dashboard Principal
**`/dashboard/nominas`**
- Estadísticas generales
- Acciones rápidas
- Alertas y notificaciones

### Calcular Nómina desde Planeaciones ⭐ **NUEVO**
**`/dashboard/nominas/calcular-desde-planeacion/[periodoId]`**

**¿Qué hace?**
1. Lee las **planeaciones aprobadas** de una semana específica
2. Suma las **horas_trabajadas** por cada empleado
3. Calcula automáticamente:
   - ✅ Horas normales (hasta 48h/semana)
   - ✅ Horas extra (50% adicional)
   - ✅ Percepciones totales
   - ✅ Deducciones (IMSS 6%, ISR 10%)
   - ✅ Neto a pagar

**Características:**
- 🔍 Filtra por semana y año
- 💰 Usa el `precio_hora` de cada empleado
- 📊 Muestra desglose completo
- 💾 Guarda la nómina calculada

### Gestión de Empleados
**`/dashboard/nominas/empleados`**
- Lista de empleados desde `/dashboard/seguridad/usuarios`
- Cada empleado tiene un campo `precio_hora` configurable

### Periodos de Nómina
**`/dashboard/nominas/periodos`**
- Crear periodos (semanal/quincenal/mensual)
- Ver historial de nóminas

## 💡 Configuración de Precio por Hora

### En la Base de Datos
Agrega el campo `precio_hora` a la tabla `usuarios`:

```sql
ALTER TABLE usuarios ADD COLUMN precio_hora DECIMAL(10,2) DEFAULT 150.00;
```

### Valores Sugeridos por Puesto
```sql
UPDATE usuarios SET precio_hora = 200 WHERE puesto = 'Supervisor';
UPDATE usuarios SET precio_hora = 150 WHERE puesto = 'Obrero';
UPDATE usuarios SET precio_hora = 250 WHERE puesto = 'Ingeniero';
UPDATE usuarios SET precio_hora = 180 WHERE puesto = 'Técnico';
```

## 🧮 Fórmulas de Cálculo

### 1. Horas Normales y Extras
```javascript
const HORAS_NORMALES_SEMANA = 48; // 8h x 6 días
const horasNormales = Math.min(horasTotales, 48);
const horasExtra = Math.max(0, horasTotales - 48);
```

### 2. Percepciones
```javascript
const pagoNormal = horasNormales * precioHora;
const pagoExtra = horasExtra * precioHora * 1.5; // 50% adicional
const totalPercepciones = pagoNormal + pagoExtra;
```

### 3. Deducciones
```javascript
const imss = totalPercepciones * 0.06; // 6%
const isr = totalPercepciones * 0.10; // 10%
const totalDeducciones = imss + isr;
```

### 4. Neto a Pagar
```javascript
const neto = totalPercepciones - totalDeducciones;
```

## 📊 Ejemplo Real

**Empleado:** Juan Pérez
**Puesto:** Supervisor
**Precio por hora:** $200

**Horas de la semana:**
- Lunes: 10h (planeación #1)
- Martes: 9h (planeación #2)
- Miércoles: 8h (planeación #2)
- Jueves: 11h (planeación #3)
- Viernes: 12h (planeación #4)
- **Total: 50 horas**

**Cálculo:**
```
Horas normales: 48h x $200 = $9,600
Horas extra:     2h x $200 x 1.5 = $600
Total percepciones: $10,200

IMSS (6%): -$612
ISR (10%): -$1,020
Total deducciones: -$1,632

NETO A PAGAR: $8,568
```

## 🔧 Estructura de Datos

### Planeación (API existente)
```typescript
interface Planeacion {
  id: number;
  semana: number;
  anio: number;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
  asignaciones: Asignacion[];
}
```

### Asignación (API existente)
```typescript
interface Asignacion {
  id: number;
  actividad_id: number;
  empleado_id: number;
  empleado_nombre: string;
  dia_semana: DiaSemana;
  horas_trabajadas?: number; // ⭐ CLAVE
}
```

### Empleado (Usuarios)
```typescript
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  puesto: string;
  precio_hora?: number; // ⭐ NUEVO CAMPO
  activo: boolean;
}
```

## 🚀 Cómo Usar

### 1. Configurar Precios por Hora
1. Ve a `/dashboard/seguridad/usuarios`
2. Edita cada empleado
3. Agrega el campo `precio_hora` (ej: 150, 200, 250)

### 2. Crear Planeaciones
1. Ve a `/dashboard/ingenierias/planeacion`
2. Crea planeaciones con actividades
3. Asigna empleados a las actividades
4. **Registra las `horas_trabajadas`** en cada asignación
5. Envía y aprueba la planeación

### 3. Calcular Nómina
1. Ve a `/dashboard/nominas`
2. Click en **"Calcular desde Planeaciones"**
3. Selecciona la semana y año
4. ¡Listo! Verás el desglose automático
5. Click en **"Guardar Nómina"**

## 📝 Notas Importantes

### ⚠️ Requisitos
- Las planeaciones deben estar en estado **"aprobada"**
- Los empleados deben tener `precio_hora` configurado (default: $150)
- Las asignaciones deben tener `horas_trabajadas` registradas

### 💡 Tips
- Puedes editar la semana/año para calcular nóminas de periodos pasados
- Las horas extras pagan automáticamente 1.5x
- Los porcentajes de IMSS/ISR son configurables en el código

### 🔮 Próximas Mejoras
- [ ] Configurar porcentajes de deducciones por empleado
- [ ] Agregar bonos y premios
- [ ] Exportar recibos de nómina en PDF
- [ ] Histórico de nóminas por empleado
- [ ] Comparativa de costos por proyecto
- [ ] Dashboard de costos de proyectos vs nóminas

## 🎨 Capturas de Pantalla

### Dashboard Principal
![Dashboard de Nóminas con el nuevo botón destacado]

### Cálculo desde Planeaciones
![Tabla con horas trabajadas y cálculos automáticos]

### Desglose por Empleado
![Vista detallada de percepciones, deducciones y neto]

---

**Desarrollado por:** Claude
**Fecha:** Diciembre 2025
**Versión:** 1.0.0
