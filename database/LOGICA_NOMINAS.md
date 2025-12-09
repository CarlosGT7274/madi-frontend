# 🧮 Lógica de Nóminas - MADI

## 📋 Flujo Completo

```
COTIZACIÓN (precio_mano_obra = 0)
    ↓
PLANEACIÓN APROBADA
    ↓
ASIGNACIONES (empleado + horas_trabajadas)
    ↓
🔥 TRIGGER AUTO-INCREMENTA precio_mano_obra
    ↓
PERIODO DE NÓMINA (semanal automático)
    ↓
CÁLCULO DE NÓMINA (horas + deducciones)
    ↓
PAGO
```

---

## 🎯 1. LÓGICA DE MANO DE OBRA EN COTIZACIONES

### ❌ NO USAR:
- **precio_hora de insumos** - ESO VALE VERGA

### ✅ USAR:
- **precio_hora de usuarios** (tabla usuarios)

### 📊 Cómo Funciona:

#### 1.1 Al crear cotización:
```sql
INSERT INTO cotizaciones (proyecto_id, precio_mano_obra, horas_mano_obra)
VALUES (123, 0.00, 0.00);
-- Siempre inicia en 0
```

#### 1.2 Al asignar empleado en planeación:
```sql
-- Empleado: Juan Pérez (precio_hora = $200)
-- Asignación: actividad_id = 5, horas_trabajadas = 8

INSERT INTO asignaciones (empleado_id, actividad_id, horas_trabajadas)
VALUES (10, 5, 8);

-- 🔥 TRIGGER SE DISPARA AUTOMÁTICAMENTE:
-- 1. Lee precio_hora del empleado (200)
-- 2. Calcula: 8 horas x $200 = $1,600
-- 3. Busca la cotización relacionada al proyecto de la planeación
-- 4. Actualiza: precio_mano_obra += 1600
--             horas_mano_obra += 8
```

#### 1.3 Al actualizar horas trabajadas:
```sql
-- Cambiar de 8 a 10 horas
UPDATE asignaciones
SET horas_trabajadas = 10
WHERE id = 123;

-- 🔥 TRIGGER SE DISPARA:
-- Diferencia: 10 - 8 = 2 horas
-- Incremento: 2 x $200 = $400
-- Actualiza: precio_mano_obra += 400
--           horas_mano_obra += 2
```

### 🧩 Relación de Tablas:
```
asignaciones.planeacion_id
    → planeaciones.proyecto_id
        → proyectos.id
            → cotizaciones.proyecto_id
                ✅ AQUÍ SE ACTUALIZA precio_mano_obra
```

---

## 📅 2. PERIODOS DE NÓMINA

### Características:
- **Tipo:** Semanal (por defecto)
- **Duración:** Lunes a Domingo
- **Pago:** Lunes siguiente
- **Automático:** Número de semana del año (1-52)

### Ejemplo:
```
Semana 48 del 2025:
├─ Inicio:  Lunes 24 de noviembre
├─ Fin:     Domingo 30 de noviembre
└─ Pago:    Lunes 1 de diciembre
```

### Estados del Periodo:
1. **abierto** - Periodo creado, aún se pueden registrar horas
2. **calculado** - Nóminas calculadas, listo para pagar
3. **pagado** - Pagos realizados
4. **cerrado** - Periodo cerrado, no se puede modificar

---

## 💰 3. CÁLCULO DE NÓMINA

### Fórmula:

```javascript
// 1. Obtener horas del empleado en el periodo
const horas = SUM(asignaciones.horas_trabajadas)
  WHERE planeacion.semana = periodo.numero_semana
  AND planeacion.anio = periodo.anio
  AND planeacion.estado = 'aprobada'
  AND asignacion.empleado_id = empleado.id

// 2. Separar horas normales y extras
const HORAS_NORMALES_MAX = 48; // 8h x 6 días
const horasNormales = Math.min(horas, HORAS_NORMALES_MAX);
const horasExtra = Math.max(0, horas - HORAS_NORMALES_MAX);

// 3. Calcular percepciones
const precioHora = empleado.precio_hora; // De tabla usuarios
const pagoNormal = horasNormales * precioHora;
const pagoExtra = horasExtra * precioHora * 1.5; // 50% extra
const totalPercepciones = pagoNormal + pagoExtra + bonos;

// 4. Calcular deducciones
const imss = totalPercepciones * 0.06; // 6%
const isr = totalPercepciones * 0.10; // 10%
const prestamo = obtenerPrestamoActivo(empleado_id).monto_quincenal;
const totalDeducciones = imss + isr + prestamo;

// 5. Neto a pagar
const netoPagar = totalPercepciones - totalDeducciones;
```

### Ejemplo Real:
```
Empleado: Juan Pérez
Precio/hora: $200
Horas trabajadas: 52 (en la semana 48)

CÁLCULO:
├─ Horas normales: 48 x $200 = $9,600
├─ Horas extra:     4 x $200 x 1.5 = $1,200
├─ Bonos: $0
└─ TOTAL PERCEPCIONES: $10,800

DEDUCCIONES:
├─ IMSS (6%):   $648
├─ ISR (10%):   $1,080
├─ Préstamo:    $500
└─ TOTAL DEDUCCIONES: $2,228

NETO A PAGAR: $8,572
```

---

## 🔗 4. DETALLE DE PLANEACIONES EN NÓMINA

La tabla `nomina_detalle_planeaciones` guarda **qué planeaciones** contribuyeron a cada nómina:

```sql
-- Al calcular nómina, por cada asignación:
INSERT INTO nomina_detalle_planeaciones (
  nomina_id,
  planeacion_id,
  asignacion_id,
  horas_trabajadas,
  precio_hora,
  monto_calculado,
  planta_id,
  proyecto_id,
  cotizacion_id
)
SELECT
  @nomina_id,
  p.id,
  a.id,
  a.horas_trabajadas,
  u.precio_hora,
  (a.horas_trabajadas * u.precio_hora),
  p.planta_id,
  p.proyecto_id,
  c.id
FROM asignaciones a
INNER JOIN planeaciones p ON a.planeacion_id = p.id
INNER JOIN usuarios u ON a.empleado_id = u.id
LEFT JOIN cotizaciones c ON c.proyecto_id = p.proyecto_id
WHERE p.numero_semana = @semana
  AND p.anio = @anio
  AND p.estado = 'aprobada'
  AND a.empleado_id = @empleado_id;
```

**Beneficios:**
- ✅ Trazabilidad completa
- ✅ Saber qué proyectos generaron qué costos
- ✅ Auditoría de planta/proyecto/cotización
- ✅ Reportes de costos por proyecto

---

## 📊 5. INFORMACIÓN EN PERIODOS

La tabla `periodos_nomina` guarda:

### Información Agregada:
```sql
{
  "total_empleados": 42,
  "total_horas": 2100,
  "total_percepciones": 315000,
  "total_deducciones": 47250,
  "neto_total": 267750
}
```

### Relación con Planeaciones:
```sql
-- Vista útil:
SELECT
  p.numero_semana,
  p.anio,
  COUNT(DISTINCT pl.id) as total_planeaciones,
  COUNT(DISTINCT pl.planta_id) as total_plantas,
  COUNT(DISTINCT pl.proyecto_id) as total_proyectos,
  SUM(a.horas_trabajadas) as total_horas
FROM periodos_nomina p
LEFT JOIN planeaciones pl ON pl.numero_semana = p.numero_semana
                          AND pl.anio = p.anio
                          AND pl.estado = 'aprobada'
LEFT JOIN asignaciones a ON a.planeacion_id = pl.id
WHERE p.id = @periodo_id
GROUP BY p.id;
```

---

## 🚀 6. FLUJO DEL API

### 6.1 Crear Periodo
```
POST /api/ingenierias/nominas/periodos
{
  "tipo": "semanal",
  "numero_semana": 48,
  "anio": 2025,
  "fecha_inicio": "2025-11-24",
  "fecha_fin": "2025-11-30",
  "fecha_pago": "2025-12-01"
}

→ Crea el periodo en estado "abierto"
```

### 6.2 Calcular Nóminas del Periodo
```
POST /api/ingenierias/nominas/periodos/:id/calcular
{
  "usuario_id": 1  // Quién calcula
}

→ Por cada empleado con horas:
  1. Busca asignaciones en planeaciones aprobadas de esa semana
  2. Suma horas_trabajadas
  3. Calcula percepciones y deducciones
  4. Crea registro en tabla nominas
  5. Crea detalles en nomina_detalle_planeaciones
  6. Actualiza totales en periodos_nomina
  7. Cambia estado a "calculado"
```

### 6.3 Pagar Nómina
```
PATCH /api/ingenierias/nominas/nominas/:id/pagar
{
  "metodo_pago": "transferencia",
  "referencia_pago": "TRANS-123456",
  "fecha_pago": "2025-12-01"
}

→ Actualiza estado a "pagada"
→ Si hay préstamo activo, descuenta y registra en historial
```

---

## 📈 7. REPORTES Y VISTAS

### Reporte: Costos de Mano de Obra por Proyecto
```sql
SELECT
  c.id as cotizacion_id,
  pr.nombre as proyecto,
  c.precio_mano_obra as costo_mano_obra,
  c.horas_mano_obra as total_horas,
  COUNT(DISTINCT ndp.empleado_id) as total_empleados,
  SUM(ndp.monto_calculado) as verificacion_monto
FROM cotizaciones c
INNER JOIN proyectos pr ON c.proyecto_id = pr.id
LEFT JOIN nomina_detalle_planeaciones ndp ON ndp.cotizacion_id = c.id
WHERE c.precio_mano_obra > 0
GROUP BY c.id;
```

### Reporte: Empleados con Mayor Costo
```sql
SELECT
  u.nombre,
  u.precio_hora,
  COUNT(a.id) as total_asignaciones,
  SUM(a.horas_trabajadas) as total_horas,
  SUM(a.horas_trabajadas * u.precio_hora) as costo_total
FROM usuarios u
INNER JOIN asignaciones a ON a.empleado_id = u.id
INNER JOIN planeaciones p ON a.planeacion_id = p.id
WHERE p.estado = 'aprobada'
  AND p.numero_semana = 48
  AND p.anio = 2025
GROUP BY u.id
ORDER BY costo_total DESC;
```

---

## ⚠️ REGLAS DE NEGOCIO

1. **NO modificar precio_mano_obra manualmente** - Solo por triggers
2. **Planeaciones deben estar aprobadas** para contar en nómina
3. **Precio_hora se congela** al momento del cálculo (se guarda en nominas.precio_hora)
4. **Préstamos se descuentan automáticamente** de la nómina
5. **Periodos son semanales** - Lunes a Domingo
6. **Horas extras pagan 1.5x** - Después de 48 horas semanales

---

## 🎯 PRIORIDADES PARA IMPLEMENTAR

### Backend - Orden de Implementación:

1. ✅ **Agregar precio_hora a usuarios** (SQL ya listo)
2. ✅ **Agregar precio_mano_obra a cotizaciones** (SQL ya listo)
3. ✅ **Crear triggers automáticos** (SQL ya listo)
4. ✅ **Crear tablas de nóminas** (SQL ya listo)
5. 🔨 **Implementar endpoints:**
   - POST /ingenierias/nominas/periodos
   - GET /ingenierias/nominas/periodos
   - POST /ingenierias/nominas/periodos/:id/calcular
   - GET /ingenierias/nominas/nominas (con filtros)
   - PATCH /ingenierias/nominas/nominas/:id/pagar

6. 🔨 **Testing:**
   - Crear planeación con asignaciones
   - Verificar que precio_mano_obra se actualiza
   - Calcular nómina
   - Verificar totales

---

**¡Todo listo para implementar!** 🚀
