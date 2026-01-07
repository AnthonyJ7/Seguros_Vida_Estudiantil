"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Simple request logger for debugging local issues
app.use((req, res, next) => {
    const start = Date.now();
    const authPresent = Boolean(req.headers.authorization);
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[req] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms) auth:${authPresent ? 'yes' : 'no'}`);
    });
    next();
});
app.use('/api', routes_1.router);
app.get('/health', (_, res) => {
    res.json({ ok: true, service: 'pya-backend', timestamp: new Date().toISOString() });
});
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`[pya-backend] listening on port ${port}`);
});
