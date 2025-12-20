'use client';

import Link from "next/link";
import { useParams } from 'next/navigation';

export default function LoginPage() {
  const { locale } = useParams<{ locale: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center mb-6">
            Login
          </h1>

          <form className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered"
                placeholder="••••••••"
                required
              />

              {/* 
							<label className="label">
                <a href="#" className="label-text-alt link link-hover">
                  Forgot password?
                </a>
              </label>
							*/}
            </div>

            <button className="btn btn-primary w-full">
              Login
            </button>
          </form>

          <div className="divider">OR</div>

          <p className="text-center text-sm">
            Don’t have an account?
            <Link 
							href={`/${locale}/signup`} 
							className="link link-primary ml-1">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
