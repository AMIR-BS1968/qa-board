import { signIn } from "@/auth";
import { Bug } from "lucide-react";

export default function LoginPage() {
  async function handleGoogleLogin() {
    "use server";
    await signIn("google", { redirectTo: "/projects" });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Background visual graphics */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-blue-500 mb-4 shadow-inner">
            <Bug className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
            QA Board
          </h1>
          <p className="text-xs text-zinc-500 mt-2 font-medium">
            Internal Issue Management & Analytics Platform
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl flex flex-col items-center">
          <div className="text-center w-full mb-6">
            <h2 className="text-sm font-semibold text-zinc-300">Welcome Back</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Sign in with your Google Workspace account to access your dashboards.
            </p>
          </div>

          <form action={handleGoogleLogin} className="w-full">
            <button
              type="submit"
              className="relative w-full flex items-center justify-center gap-3 bg-white text-zinc-950 font-semibold text-sm py-3 px-4 rounded-xl hover:bg-zinc-100 active:scale-[0.98] transition duration-200 shadow-md cursor-pointer"
            >
              {/* Google G Logo icon */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.49C21.68,11.77 21.56,11.41 21.35,11.1z" fill="#4285F4" />
                  <path d="M12,20.9c2.43,0 4.47,-0.8 5.96,-2.18l-2.92,-2.27c-0.81,0.54 -1.85,0.87 -3.04,0.87 -2.34,0 -4.32,-1.58 -5.02,-3.7H3.59v2.33C5.07,18.84 8.27,20.9 12,20.9z" fill="#34A853" />
                  <path d="M6.98,13.62c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7s0.1,-1.16 0.28,-1.7V7.89H3.59v4.61v2.33l3.39,-2.62C6.98,13.62 6.98,13.62 6.98,13.62z" fill="#FBBC05" />
                  <path d="M12,6.13c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,3.39 14.43,2.7 12,2.7C8.27,2.7 5.07,4.76 3.59,7.89l3.39,2.62C7.68,7.71 9.66,6.13 12,6.13z" fill="#EA4335" />
                </g>
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-[10px] text-zinc-600 font-medium">
            Protected by Google OAuth. For internal use only.
          </p>
        </div>
      </div>
    </div>
  );
}
