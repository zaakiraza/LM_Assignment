import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import EmployeeService from "../services/employeeService.js";
import responseHandler from "../utils/responseHandler.js";
import { serializeEmployee } from "../utils/serializers.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(employee) {
    return jwt.sign(
        { sub: String(employee._id), email: employee.email },
        process.env.JWT_SECRET || "dev-secret",
        { expiresIn: "7d" }
    );
}

class AuthController {
    async googleLogin(req, res) {
        try {
            const { credential, idToken } = req.body;
            const token = credential || idToken;
            if (!token) {
                return responseHandler.error(res, "Google credential is required", 400);
            }

            if (!process.env.GOOGLE_CLIENT_ID) {
                return responseHandler.error(res, "GOOGLE_CLIENT_ID is not configured on the server", 500);
            }

            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            if (!payload?.email || !payload.sub) {
                return responseHandler.error(res, "Invalid Google token", 401);
            }

            const employee = await EmployeeService.loginWithGoogle({
                googleId: payload.sub,
                email: payload.email,
                name: payload.name || payload.email,
                avatar: payload.picture || ""
            });

            return responseHandler.success(res, {
                token: signToken(employee),
                user: serializeEmployee(employee)
            }, "Signed in with Google");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Google sign-in failed", 400);
        }
    }

    async me(req, res) {
        return responseHandler.success(res, { user: req.authUser }, "Current user");
    }

    async logout(_req, res) {
        return responseHandler.success(res, { loggedOut: true }, "Logged out");
    }
}

export default new AuthController();
