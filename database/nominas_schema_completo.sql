-- ==================================================
-- MÓDULO DE NÓMINAS - ESTRUCTURA DE BASE DE DATOS
-- ==================================================

-- --------------------------------------------------
-- 1. Agregar campos a tabla usuarios
-- --------------------------------------------------
ALTER TABLE usuarios
ADD COLUMN precio_hora DECIMAL(10,2) DEFAULT 150.00
COMMENT 'Precio por hora del empleado para cálculo de nóminas';

-- Índice para optimizar consultas de nóminas
ALTER TABLE usuarios
ADD KEY idx_usuarios_precio_hora (precio_hora);

-- --------------------------------------------------
-- 2. Agregar campos a cotizaciones
-- --------------------------------------------------
ALTER TABLE ing_proy_cotizaciones
ADD COLUMN precio_mano_obra DECIMAL(12,2) DEFAULT 0.00
COMMENT 'Costo total de mano de obra calculado desde planeaciones';

ALTER TABLE ing_proy_cotizaciones
ADD COLUMN horas_mano_obra DECIMAL(10,2) DEFAULT 0.00
COMMENT 'Total de horas de mano de obra';

-- Índices para reportes de costos
ALTER TABLE ing_proy_cotizaciones
ADD KEY idx_cotizaciones_mano_obra (precio_mano_obra);

ALTER TABLE ing_proy_cotizaciones
ADD KEY idx_cotizaciones_horas_mano_obra (horas_mano_obra);

-- =====================================================
-- 3. TABLA: periodos_nomina
-- =====================================================

CREATE TABLE IF NOT EXISTS periodos_nomina (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('semanal', 'quincenal', 'mensual') NOT NULL DEFAULT 'semanal',
  numero_semana INT NOT NULL COMMENT 'Número de semana del año (1-52)',
  anio INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  fecha_pago DATE NOT NULL,
  estado ENUM('abierto', 'calculado', 'pagado', 'cerrado') DEFAULT 'abierto',

  -- Totales del periodo
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
-- 4. TABLA: nominas (Nómina por empleado)
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
-- 5. TABLA: nomina_detalle_planeaciones
-- Relación de qué planeaciones contribuyeron a cada nómina
-- NOTA: Solo se crea si existe la tabla 'planeaciones'
-- =====================================================

CREATE TABLE IF NOT EXISTS nomina_detalle_planeaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomina_id INT NOT NULL,
  planeacion_id INT NOT NULL,
  asignacion_id INT NOT NULL COMMENT 'ID de la asignación específica',

  -- Datos de la contribución
  horas_trabajadas DECIMAL(10,2) NOT NULL,
  precio_hora DECIMAL(10,2) NOT NULL,
  monto_calculado DECIMAL(12,2) NOT NULL COMMENT 'horas * precio_hora',

  -- Contexto
  planta_id INT,
  proyecto_id INT,
  cotizacion_id INT,
  dia_semana VARCHAR(20),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (nomina_id) REFERENCES nominas(id) ON DELETE CASCADE,
  -- NOTA: Descomentar si existe la tabla planeaciones
  -- FOREIGN KEY (planeacion_id) REFERENCES planeaciones(id),

  INDEX idx_detalle_nomina (nomina_id),
  INDEX idx_detalle_planeacion (planeacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. TABLA: prestamos_empleados
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
-- 7. TABLA: historial_pagos_prestamos
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
-- 8. TRIGGERS PARA AUTO-ACTUALIZAR COTIZACIONES
-- NOTA: Solo descomentar si existen las tablas:
--       - planeaciones
--       - asignaciones
-- =====================================================

/*
DELIMITER $$

CREATE TRIGGER after_asignacion_update_horas
AFTER UPDATE ON asignaciones
FOR EACH ROW
BEGIN
  DECLARE v_precio_hora DECIMAL(10,2);
  DECLARE v_monto_mano_obra DECIMAL(12,2);
  DECLARE v_cotizacion_id INT;

  -- Solo si cambió horas_trabajadas
  IF NEW.horas_trabajadas != OLD.horas_trabajadas THEN

    -- Obtener precio_hora del empleado
    SELECT precio_hora INTO v_precio_hora
    FROM usuarios
    WHERE id = NEW.empleado_id;

    -- Calcular monto (puede ser negativo si disminuyeron las horas)
    SET v_monto_mano_obra = (NEW.horas_trabajadas - OLD.horas_trabajadas) * IFNULL(v_precio_hora, 150);

    -- Obtener cotizacion_id desde planeacion -> proyecto
    SELECT p.proyecto_id INTO @proyecto_id
    FROM planeaciones p
    WHERE p.id = NEW.planeacion_id;

    -- Obtener cotizacion_id
    SELECT c.id INTO v_cotizacion_id
    FROM ing_proy_cotizaciones c
    WHERE c.proyecto_id = @proyecto_id
    LIMIT 1;

    -- Actualizar cotización
    IF v_cotizacion_id IS NOT NULL THEN
      UPDATE ing_proy_cotizaciones
      SET
        precio_mano_obra = precio_mano_obra + v_monto_mano_obra,
        horas_mano_obra = horas_mano_obra + (NEW.horas_trabajadas - OLD.horas_trabajadas)
      WHERE id = v_cotizacion_id;
    END IF;

  END IF;
END$$

-- Trigger: Cuando se inserta una nueva asignación con horas
CREATE TRIGGER after_asignacion_insert_horas
AFTER INSERT ON asignaciones
FOR EACH ROW
BEGIN
  DECLARE v_precio_hora DECIMAL(10,2);
  DECLARE v_monto_mano_obra DECIMAL(12,2);
  DECLARE v_cotizacion_id INT;

  IF NEW.horas_trabajadas > 0 THEN

    -- Obtener precio_hora del empleado
    SELECT precio_hora INTO v_precio_hora
    FROM usuarios
    WHERE id = NEW.empleado_id;

    -- Calcular monto
    SET v_monto_mano_obra = NEW.horas_trabajadas * IFNULL(v_precio_hora, 150);

    -- Obtener cotizacion_id desde planeacion -> proyecto
    SELECT p.proyecto_id INTO @proyecto_id
    FROM planeaciones p
    WHERE p.id = NEW.planeacion_id;

    -- Obtener cotizacion_id
    SELECT c.id INTO v_cotizacion_id
    FROM ing_proy_cotizaciones c
    WHERE c.proyecto_id = @proyecto_id
    LIMIT 1;

    -- Actualizar cotización
    IF v_cotizacion_id IS NOT NULL THEN
      UPDATE ing_proy_cotizaciones
      SET
        precio_mano_obra = precio_mano_obra + v_monto_mano_obra,
        horas_mano_obra = horas_mano_obra + NEW.horas_trabajadas
      WHERE id = v_cotizacion_id;
    END IF;

  END IF;
END$$

DELIMITER ;
*/

-- =====================================================
-- 9. VISTAS ÚTILES
-- =====================================================

-- Vista: Resumen de nóminas por periodo
CREATE OR REPLACE VIEW vista_resumen_periodos AS
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
CREATE OR REPLACE VIEW vista_nominas_empleados AS
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

-- =====================================================
-- 10. DATOS INICIALES / SEEDS
-- =====================================================

-- Crear periodo actual (semana actual)
INSERT INTO periodos_nomina (tipo, numero_semana, anio, fecha_inicio, fecha_fin, fecha_pago, creado_por)
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
-- NOTAS IMPORTANTES:
-- 1. Los precios por hora se configuran desde la UI
-- 2. Los triggers están comentados - activarlos solo si existen las tablas necesarias
-- 3. Cada empresa configura sus propios precios
-- 4. El campo horas_mano_obra se agregó para tracking completo
-- =====================================================
