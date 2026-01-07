"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(roles) {
    return (req, res, next) => {
        const rol = req.user?.rol;
        if (!rol || !roles.includes(rol)) {
            return res.status(403).json({ error: 'Acceso denegado para este rol' });
        }
        next();
    };
}
