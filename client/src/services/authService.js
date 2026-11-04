import api from "./api";

class AuthService {
    async googleLogin(credential) {
        const response = await api.post("/auth/google", { credential });
        return response.data.data;
    }

    async me() {
        const response = await api.get("/auth/me");
        return response.data.data.user;
    }

    async logout() {
        try {
            await api.post("/auth/logout");
        }
        catch {
            // local logout still proceeds
        }
    }
}

export default new AuthService();
