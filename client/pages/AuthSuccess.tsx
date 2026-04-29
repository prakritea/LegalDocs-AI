import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";

const AuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            // We don't have user info yet, but the AuthContext logic 
            // typically handles fetching 'me' if it needs to, 
            // or we can just set the token.
            // Assuming context login(token, user) structure:
            localStorage.setItem("token", token);

            // Fetch user profile to complete login
            api.get<any>("/me")
                .then(res => {
                    const userData = res.data;
                    login(token, userData);
                    navigate("/dashboard");
                })
                .catch(err => {
                    console.error("Social auth profile fetch failed", err);
                    navigate("/signin?error=profile_fetch_failed");
                });
        } else {
            navigate("/signin?error=social_auth_failed");
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Authenticating...</h2>
            <p className="text-slate-400">Please wait while we complete your sign in.</p>
        </div>
    );
};

export default AuthSuccess;
