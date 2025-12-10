-- ==================================================
-- MÓDULO DE NÓMINAS - ESTRUCTURA DE BASE DE DATOS
-- VERSIÓN CORREGIDA - Basada en arquitectura real
-- ==================================================

-- --------------------------------------------------
-- 1. Agregar campo precio_hora a usuarios
-- --------------------------------------------------
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS precio_hora DECIMAL(10,2) DEFAULT 150.00
COMMENT 'Precio por hora del empleado para cálculo de nóminas';

-- Índice para optimizar consultas de nóminas
ALTER TABLE usuarios
ADD KEY IF NOT EXISTS idx_usuarios_precio_hora (precio_hora);

-- --------------------------------------------------
-- 2. Agregar campo precio_mano_obra a PARTIDAS
--    (NO a cotizaciones - las partidas son las que tienen mano de obra)
-- --------------------------------------------------
ALTER TABLE ing_proy_partidas
ADD COLUMN IF NOT EXISTS precio_mano_obra DECIMAL(12,2) DEFAULT 0.00
COMMENT 'Costo total de mano de obra calculado desde asignaciones (horas × precio_hora)';

-- Índice para reportes de costos por partida
ALTER TABLE ing_proy_partidas
ADD KEY IF NOT EXISTS idx_partidas_mano_obra (precio_mano_obra);

-- --------------------------------------------------
-- 3. Agregar partida_id a asignaciones
--    (Para relacionar asignación → partida directamente)
-- --------------------------------------------------
ALTER TABLE ing_planeacion_asignaciones
ADD COLUMN IF NOT EXISTS partida_id INT(10) UNSIGNED NULL
COMMENT 'Referencia a la partida de la cotización (actividad = partida)';

-- FK a partidas
ALTER TABLE ing_planeacion_asignaciones
ADD CONSTRAINT IF NOT EXISTS FK_asignacion_partida
FOREIGN KEY (partida_id) REFERENCES ing_proy_partidas(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Índice para consultas rápidas
ALTER TABLE ing_planeacion_asignaciones
ADD KEY IF NOT EXISTS idx_asignacion_partida (partida_id);

-- =====================================================
-- 4. TABLA: periodos_nomina
--    Modificada para incluir referencias a planeaciones
-- =====================================================

CREATE TABLE IF NOT EXISTS periodos_nomina (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Tipo de periodo
  tipo ENUM('semanal', 'quincenal', 'mensual') NOT NULL DEFAULT 'semanal',
  numero_semana INT NOT NULL COMMENT 'Número de semana del año (1-52)',
  anio INT NOT NULL,

  -- Fechas
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  fecha_pago DATE NOT NULL,
  estado ENUM('abierto', 'calculado', 'pagado', 'cerrado') DEFAULT 'abierto',

  -- Totales del periodo (calculados automáticamente)
  total_empleados INT DEFAULT 0,
  total_horas DECIMAL(10,2) DEFAULT 0.00,
  total_percepciones DECIMAL(12,2) DEFAULT 0.00,
  total_deducciones DECIMAL(12,2) DEFAULT 0.00,
  neto_total DECIMAL(12,2) DEFAULT 0.00,

  -- Auditoría
  creado_por INT,
  calculado_por INT,
  pagado_por INT,
  fecha_calculo TIMESTAMP NULL,
  fecha_pago_real TIMESTAMP NULL,
  notas TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (creado_por) REFERENCES usuarios(id),
  FOREIGN KEY (calculado_por) REFERENCES usuarios(id),
  FOREIGN KEY (pagado_por) REFERENCES usuarios(id),

  UNIQUE KEY unique_periodo (numero_semana, anio, tipo),
  INDEX idx_periodo_estado (estado),
  INDEX idx_periodo_fecha (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. TABLA: nominas (Nómina por empleado)
-- =====================================================

CREATE TABLE IF NOT EXISTS nominas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  periodo_nomina_id INT NOT NULL,
  empleado_id INT NOT NULL COMMENT 'ID del usuario/empleado',

  -- Datos del cálculo
  dias_trabajados INT DEFAULT 0,
  horas_normales DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Hasta 48 horas semanales',
  horas_extra DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Horas que exceden 48',
  precio_hora DECIMAL(10,2) NOT NULL COMMENT 'Precio por hora del empleado en el momento del cálculo',

  -- Percepciones
  pago_horas_normales DECIMAL(12,2) DEFAULT 0.00,
  pago_horas_extra DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Horas extra pagan 1.5x',
  bonos DECIMAL(12,2) DEFAULT 0.00,
  vales_despensa DECIMAL(12,2) DEFAULT 0.00,
  otras_percepciones DECIMAL(12,2) DEFAULT 0.00,
  total_percepciones DECIMAL(12,2) NOT NULL,

  -- Deducciones
  imss DECIMAL(12,2) DEFAULT 0.00 COMMENT 'IMSS 6%',
  isr DECIMAL(12,2) DEFAULT 0.00 COMMENT 'ISR 10%',
  infonavit DECIMAL(12,2) DEFAULT 0.00,
  prestamo DECIMAL(12,2) DEFAULT 0.00,
  faltas DECIMAL(12,2) DEFAULT 0.00,
  otras_deducciones DECIMAL(12,2) DEFAULT 0.00,
  total_deducciones DECIMAL(12,2) NOT NULL,

  -- Total
  neto_pagar DECIMAL(12,2) NOT NULL,

  -- Estado y pago
  estado ENUM('calculada', 'pagada', 'cancelada') DEFAULT 'calculada',
  metodo_pago ENUM('efectivo', 'transferencia', 'cheque') NULL,
  referencia_pago VARCHAR(100) NULL COMMENT 'Número de transferencia/cheque',
  fecha_pago TIMESTAMP NULL,

  -- Auditoría
  calculado_por INT NOT NULL,
  pagado_por INT NULL,
  notas TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (periodo_nomina_id) REFERENCES periodos_nomina(id) ON DELETE CASCADE,
  FOREIGN KEY (empleado_id) REFERENCES usuarios(id),
  FOREIGN KEY (calculado_por) REFERENCES usuarios(id),
  FOREIGN KEY (pagado_por) REFERENCES usuarios(id),

  UNIQUE KEY unique_nomina_empleado (periodo_nomina_id, empleado_id),
  INDEX idx_nomina_empleado (empleado_id),
  INDEX idx_nomina_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. TABLA: nomina_detalle_asignaciones
--    Relaciona qué asignaciones contribuyeron a cada nómina
-- =====================================================

CREATE TABLE IF NOT EXISTS nomina_detalle_asignaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomina_id INT NOT NULL,
  asignacion_id INT UNSIGNED NOT NULL COMMENT 'ID de ing_planeacion_asignaciones',
  planeacion_id INT UNSIGNED NOT NULL,
  partida_id INT UNSIGNED NULL COMMENT 'Partida relacionada a la asignación',

  -- Datos de la contribución
  horas_trabajadas DECIMAL(10,2) NOT NULL,
  precio_hora DECIMAL(10,2) NOT NULL,
  monto_calculado DECIMAL(12,2) NOT NULL COMMENT 'horas × precio_hora',

  -- Contexto adicional
  dia_semana VARCHAR(20),
  empleado_nombre VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (nomina_id) REFERENCES nominas(id) ON DELETE CASCADE,
  FOREIGN KEY (asignacion_id) REFERENCES ing_planeacion_asignaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (planeacion_id) REFERENCES ing_planeaciones(id),
  FOREIGN KEY (partida_id) REFERENCES ing_proy_partidas(id),

  INDEX idx_detalle_nomina (nomina_id),
  INDEX idx_detalle_asignacion (asignacion_id),
  INDEX idx_detalle_planeacion (planeacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. TABLA: prestamos_empleados
-- =====================================================

CREATE TABLE IF NOT EXISTS prestamos_empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,

  monto_total DECIMAL(12,2) NOT NULL,
  monto_quincenal DECIMAL(12,2) NOT NULL COMMENT 'Cuanto se descuenta por quincena',
  saldo_pendiente DECIMAL(12,2) NOT NULL,

  numero_pagos_total INT NOT NULL,
  numero_pagos_realizados INT DEFAULT 0,

  fecha_inicio DATE NOT NULL,
  fecha_ultimo_pago DATE NULL,

  estado ENUM('activo', 'liquidado', 'cancelado') DEFAULT 'activo',

  descripcion TEXT,
  notas TEXT,

  creado_por INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (empleado_id) REFERENCES usuarios(id),
  FOREIGN KEY (creado_por) REFERENCES usuarios(id),

  INDEX idx_prestamo_empleado (empleado_id),
  INDEX idx_prestamo_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. TABLA: historial_pagos_prestamos
-- =====================================================

CREATE TABLE IF NOT EXISTS historial_pagos_prestamos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prestamo_id INT NOT NULL,
  nomina_id INT NOT NULL COMMENT 'Nómina de la cual se descontó',

  monto_pagado DECIMAL(12,2) NOT NULL,
  saldo_anterior DECIMAL(12,2) NOT NULL,
  saldo_nuevo DECIMAL(12,2) NOT NULL,

  fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (prestamo_id) REFERENCES prestamos_empleados(id) ON DELETE CASCADE,
  FOREIGN KEY (nomina_id) REFERENCES nominas(id),

  INDEX idx_historial_prestamo (prestamo_id),
  INDEX idx_historial_nomina (nomina_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. TRIGGERS PARA AUTO-CALCULAR PRECIO_MANO_OBRA
--    Cuando cambian horas_trabajadas en asignaciones
--    → actualizar precio_mano_obra en la PARTIDA
-- =====================================================

DELIMITER $$

-- Trigger: Cuando se ACTUALIZA una asignación (cambian horas)
DROP TRIGGER IF EXISTS after_asignacion_update_horas$$
CREATE TRIGGER after_asignacion_update_horas
AFTER UPDATE ON ing_planeacion_asignaciones
FOR EACH ROW
BEGIN
  DECLARE v_precio_hora DECIMAL(10,2);
  DECLARE v_delta_horas DECIMAL(10,2);
  DECLARE v_delta_monto DECIMAL(12,2);

  -- Solo si cambió horas_trabajadas
  IF NEW.horas_trabajadas != OLD.horas_trabajadas THEN

    -- Obtener precio_hora del empleado
    SELECT precio_hora INTO v_precio_hora
    FROM usuarios
    WHERE id = NEW.empleado_id;

    -- Calcular diferencia de horas
    SET v_delta_horas = NEW.horas_trabajadas - OLD.horas_trabajadas;

    -- Calcular diferencia de monto (puede ser negativo si disminuyeron las horas)
    SET v_delta_monto = v_delta_horas * IFNULL(v_precio_hora, 150);

    -- Actualizar precio_mano_obra en la PARTIDA (si existe partida_id)
    IF NEW.partida_id IS NOT NULL THEN
      UPDATE ing_proy_partidas
      SET precio_mano_obra = precio_mano_obra + v_delta_monto
      WHERE id = NEW.partida_id;
    END IF;

  END IF;
END$$

-- Trigger: Cuando se INSERTA una nueva asignación con horas
DROP TRIGGER IF EXISTS after_asignacion_insert_horas$$
CREATE TRIGGER after_asignacion_insert_horas
AFTER INSERT ON ing_planeacion_asignaciones
FOR EACH ROW
BEGIN
  DECLARE v_precio_hora DECIMAL(10,2);
  DECLARE v_monto_mano_obra DECIMAL(12,2);

  IF NEW.horas_trabajadas > 0 AND NEW.partida_id IS NOT NULL THEN

    -- Obtener precio_hora del empleado
    SELECT precio_hora INTO v_precio_hora
    FROM usuarios
    WHERE id = NEW.empleado_id;

    -- Calcular monto
    SET v_monto_mano_obra = NEW.horas_trabajadas * IFNULL(v_precio_hora, 150);

    -- Actualizar precio_mano_obra en la PARTIDA
    UPDATE ing_proy_partidas
    SET precio_mano_obra = precio_mano_obra + v_monto_mano_obra
    WHERE id = NEW.partida_id;

  END IF;
END$$

-- Trigger: Cuando se ELIMINA una asignación (restar el costo)
DROP TRIGGER IF EXISTS after_asignacion_delete_horas$$
CREATE TRIGGER after_asignacion_delete_horas
AFTER DELETE ON ing_planeacion_asignaciones
FOR EACH ROW
BEGIN
  DECLARE v_precio_hora DECIMAL(10,2);
  DECLARE v_monto_mano_obra DECIMAL(12,2);

  IF OLD.horas_trabajadas > 0 AND OLD.partida_id IS NOT NULL THEN

    -- Obtener precio_hora del empleado
    SELECT precio_hora INTO v_precio_hora
    FROM usuarios
    WHERE id = OLD.empleado_id;

    -- Calcular monto a restar
    SET v_monto_mano_obra = OLD.horas_trabajadas * IFNULL(v_precio_hora, 150);

    -- Restar precio_mano_obra de la PARTIDA
    UPDATE ing_proy_partidas
    SET precio_mano_obra = precio_mano_obra - v_monto_mano_obra
    WHERE id = OLD.partida_id;

  END IF;
END$$

DELIMITER ;

-- =====================================================
-- 10. VISTAS ÚTILES
-- =====================================================

-- Vista: Resumen de nóminas por periodo
DROP VIEW IF EXISTS vista_resumen_periodos;
CREATE VIEW vista_resumen_periodos AS
SELECT
  p.id,
  p.tipo,
  p.numero_semana,
  p.anio,
  p.fecha_inicio,
  p.fecha_fin,
  p.fecha_pago,
  p.estado,
  COUNT(DISTINCT n.empleado_id) as total_empleados,
  SUM(n.horas_normales + n.horas_extra) as total_horas,
  SUM(n.total_percepciones) as total_percepciones,
  SUM(n.total_deducciones) as total_deducciones,
  SUM(n.neto_pagar) as neto_total
FROM periodos_nomina p
LEFT JOIN nominas n ON p.id = n.periodo_nomina_id
GROUP BY p.id;

-- Vista: Nóminas con datos de empleado
DROP VIEW IF EXISTS vista_nominas_empleados;
CREATE VIEW vista_nominas_empleados AS
SELECT
  n.*,
  u.nombre as empleado_nombre,
  u.correo as empleado_correo,
  r.nombre as empleado_rol,
  p.numero_semana,
  p.anio,
  p.fecha_inicio as periodo_inicio,
  p.fecha_fin as periodo_fin
FROM nominas n
INNER JOIN usuarios u ON n.empleado_id = u.id
LEFT JOIN roles r ON u.rol_id = r.id
INNER JOIN periodos_nomina p ON n.periodo_nomina_id = p.id;

-- Vista: Costo de mano de obra por partida (útil para reportes)
DROP VIEW IF EXISTS vista_costo_partidas;
CREATE VIEW vista_costo_partidas AS
SELECT
  pt.id as partida_id,
  pt.cotizacion_id,
  pt.numero_partida,
  pt.descripcion,
  pt.cantidad,
  pt.unidad,
  pt.precio_unitario,
  pt.importe as importe_materiales,
  pt.precio_mano_obra,
  (pt.importe + pt.precio_mano_obra) as costo_total,
  c.folio as cotizacion_folio,
  c.estado as cotizacion_estado
FROM ing_proy_partidas pt
INNER JOIN ing_proy_cotizaciones c ON pt.cotizacion_id = c.id;

-- =====================================================
-- 11. DATOS INICIALES / SEEDS
-- =====================================================

-- Crear periodo actual (semana actual) - solo si no existe
INSERT IGNORE INTO periodos_nomina (tipo, numero_semana, anio, fecha_inicio, fecha_fin, fecha_pago, creado_por)
VALUES (
  'semanal',
  WEEK(CURDATE(), 1),
  YEAR(CURDATE()),
  DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
  DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY),
  DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY), INTERVAL 1 DAY),
  1
);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
--
-- RESUMEN DE CAMBIOS:
-- ✅ precio_hora en usuarios (configurable desde UI)
-- ✅ precio_mano_obra en PARTIDAS (no en cotizaciones)
-- ✅ partida_id agregado a asignaciones
-- ✅ Triggers auto-calculan costos cuando cambian horas
-- ✅ Tablas de nóminas, periodos, préstamos
-- ✅ Vistas útiles para reportes
-- ✅ Sin duplicación de datos
-- =====================================================
