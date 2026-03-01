import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!data) {
        navigate("/home", { replace: true });
        return;
      }
      setAuthorized(true);
    };
    check();
  }, [navigate]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Checking access…</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
