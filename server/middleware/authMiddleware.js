import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import responseHandler from "../utils/responseHandler.js";
import { isHR, isLMCapable } from "../constants/positions.js";
import { serializeEmployee } from "../utils/serializers.js";

function getToken(req) {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
        return header.slice(7);
    }
    return req.cookies?.token || null;
}

export async function requireAuth(req, res, next) {
    try {
        const token = getToken(req);
        if (!token) {
            return responseHandler.error(res, "Authentication required", 401);
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
        const employee = await Employee.findById(payload.sub);
        if (!employee) {
            return responseHandler.error(res, "Employee not found", 401);
        }

        req.employee = employee;
        req.authUser = serializeEmployee(employee);
        next();
    }
    catch (error) {
        return responseHandler.error(res, "Invalid or expired token", 401);
    }
}

export function requireVerified(req, res, next) {
    if (!req.employee?.isVerified) {
        return responseHandler.error(res, "Your account is pending HR verification", 403);
    }
    next();
}

/** @deprecated Use requireVerified */
export const requireActiveEmployee = requireVerified;

export function requireHR(req, res, next) {
    if (!req.employee?.isVerified || !isHR(req.employee.position)) {
        return responseHandler.error(res, "HR access required", 403);
    }
    next();
}

export function requireLMOrHR(req, res, next) {
    const position = req.employee?.position;
    if (!req.employee?.isVerified || (!isHR(position) && !isLMCapable(position))) {
        return responseHandler.error(res, "Line manager or HR access required", 403);
    }
    next();
}

export function requireSelfOrHR(paramName = "employeeId") {
    return (req, res, next) => {
        if (!req.employee?.isVerified) {
            return responseHandler.error(res, "Your account is pending HR verification", 403);
        }

        if (isHR(req.employee.position)) return next();

        const targetId = String(req.params[paramName] || "");
        const selfId = String(req.employee._id);
        if (targetId && targetId === selfId) return next();

        return responseHandler.error(res, "You can only access your own profile", 403);
    };
}
