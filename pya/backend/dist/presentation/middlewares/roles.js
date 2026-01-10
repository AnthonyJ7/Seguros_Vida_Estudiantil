"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(roles) {
    return (req, res, next) => {
        const rol = req.user?.rol?.toUpperCase();
        const rolesUpper = roles.map(r => r.toUpperCase());
        if (!rol || !rolesUpper.includes(rol)) {
            return res.status(403).json({ error: `Acceso denegado. Rol requerido: ${roles.join(', ')}. Rol actual: ${req.user?.rol}` });
        }
        next();
    };
}
